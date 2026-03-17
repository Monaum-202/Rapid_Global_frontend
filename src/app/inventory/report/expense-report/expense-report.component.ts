import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import {
  ExpenseReportSummaryDTO,
  ExpenseReportRowDTO,
  ExpenseStatus,
  ExpenseReportService,
  SpringPage
} from 'src/app/core/services/Report/expense-report.service';

interface StatCard {
  label: string;
  value: string | number;
  variant: 'default' | 'success' | 'danger' | 'warning';
  icon: string;
}

@Component({
  selector: 'app-expense-report',
  templateUrl: './expense-report.component.html',
  styleUrls: ['./expense-report.component.css']
})
export class ExpenseReportComponent implements OnInit, OnDestroy {

  // ---- Filter form ----
  filterForm!: FormGroup;
  readonly statusOptions = ['', 'PENDING', 'APPROVED', 'CANCELLED'];

  // ---- Summary ----
  summary: ExpenseReportSummaryDTO | null = null;
  statCards: StatCard[] = [];
  summaryLoading = false;

  // ---- Table ----
  rows: ExpenseReportRowDTO[] = [];
  totalElements = 0;
  totalPages    = 0;
  currentPage   = 0;
  pageSize      = 50;
  tableLoading  = false;

  // ---- Export ----
  excelExporting = false;
  pdfExporting   = false;

  // ---- Error ----
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ExpenseReportService,
    public pageHeaderService: PageHeaderService,
  ) { }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Expense Report');
    this.buildForm();
    this.loadAll();

    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadAll();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----------------------------------------------------------------
  // Form
  // ----------------------------------------------------------------

  private buildForm(): void {
    const now      = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filterForm = this.fb.group({
      dateFrom:     [this.formatDate(firstDay)],
      dateTo:       [this.formatDate(now)],
      status:       [''],
      paidTo:       [''],
      categoryName: [''],
      employeeName: [''],
    });
  }

  get f() { return this.filterForm.value; }

  // ----------------------------------------------------------------
  // Load
  // ----------------------------------------------------------------

  loadAll(): void {
    this.loadSummary();
    this.loadTable();
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    this.errorMessage   = null;

    this.reportService.getSummary(this.f)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.summary = res;
          this.buildStatCards(res);
          this.summaryLoading = false;
        },
        error: err => {
          this.errorMessage   = err.message;
          this.summaryLoading = false;
        }
      });
  }

  private loadTable(): void {
    this.tableLoading = true;

    this.reportService.getReportPage({ ...this.f, page: this.currentPage, size: this.pageSize })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: SpringPage<ExpenseReportRowDTO>) => {
          this.rows          = page.content;
          this.totalPages    = page.totalPages;
          this.totalElements = page.totalElements;
          this.tableLoading  = false;
        },
        error: err => {
          this.errorMessage = err.message;
          this.tableLoading = false;
        }
      });
  }

  // ----------------------------------------------------------------
  // Stat Cards
  // ----------------------------------------------------------------

  private buildStatCards(s: ExpenseReportSummaryDTO): void {
    this.statCards = [
      { label: 'Total Records',    value: s.totalRecords,             variant: 'default', icon: '📋' },
      { label: 'Total Expenses',   value: this.money(s.totalAmount),  variant: 'danger',  icon: '💸' },
      { label: 'Approved Amount',  value: this.money(s.totalApproved),variant: 'success', icon: '✅' },
      { label: 'Pending Amount',   value: this.money(s.totalPending), variant: 'warning', icon: '⏳' },
    ];
  }

  // ----------------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------------

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadTable();
  }

  get pages(): number[] {
    const total   = this.totalPages;
    const current = this.currentPage;
    const delta   = 2;
    const range: number[] = [];
    for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  onPageSizeChange(size: number): void {
    this.pageSize    = size;
    this.currentPage = 0;
    this.loadTable();
  }

  // ----------------------------------------------------------------
  // Exports
  // ----------------------------------------------------------------

  exportExcel(): void {
    if (!this.f.dateFrom || !this.f.dateTo) {
      this.errorMessage = 'Please select a date range before exporting.';
      return;
    }
    this.excelExporting = true;
    setTimeout(() => {
      this.reportService.downloadExcel(this.f);
      setTimeout(() => this.excelExporting = false, 2000);
    }, 50);
  }

  exportPdf(): void {
    if (!this.f.dateFrom || !this.f.dateTo) {
      this.errorMessage = 'Please select a date range before exporting.';
      return;
    }
    if (this.totalElements > 5000) {
      this.errorMessage = `PDF is limited to 5,000 rows. Your query has ${this.totalElements} rows. Use Excel instead.`;
      return;
    }
    this.pdfExporting = true;
    setTimeout(() => {
      this.reportService.downloadPdf(this.f);
      setTimeout(() => this.pdfExporting = false, 2000);
    }, 50);
  }

  // ----------------------------------------------------------------
  // Reset
  // ----------------------------------------------------------------

  resetFilters(): void {
    this.buildForm();
    this.currentPage = 0;
    this.loadAll();
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  money(val: number): string {
    return (val ?? 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  statusClass(status: ExpenseStatus): string {
    const map: Record<ExpenseStatus, string> = {
      APPROVED:  'badge-success',
      CANCELLED: 'badge-danger',
      PENDING:   'badge-warning',
    };
    return map[status] ?? 'badge-secondary';
  }

  get countByStatus(): { label: string; count: number }[] {
    if (!this.summary?.countByStatus) return [];
    return Object.entries(this.summary.countByStatus)
      .map(([label, count]) => ({ label, count }));
  }

  get countByCategory(): { label: string; count: number }[] {
    if (!this.summary?.countByCategory) return [];
    return Object.entries(this.summary.countByCategory)
      .map(([label, count]) => ({ label, count }));
  }

  trackById(_: number, row: ExpenseReportRowDTO): number { return row.id; }
}