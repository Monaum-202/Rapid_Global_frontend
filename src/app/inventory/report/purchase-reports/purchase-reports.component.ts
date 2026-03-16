import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import {
  PurchaseReportSummaryDTO,
  PurchaseReportRowDTO,
  OrderStatus,
  PurchaseReportService,
  SpringPage
} from 'src/app/core/services/Report/purchase-report.service';

interface StatCard {
  label: string;
  value: string | number;
  variant: 'default' | 'success' | 'danger' | 'warning';
  icon: string;
}

@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-reports.component.html',
  styleUrls: ['./purchase-reports.component.css']
})
export class PurchaseReportsComponent implements OnInit, OnDestroy {

  // ---- Filter form ----
  filterForm!: FormGroup;
  readonly statusOptions = ['', 'PENDING', 'COMPLETED', 'CANCELLED', 'PROCESSING'];

  // ---- Summary ----
  summary: PurchaseReportSummaryDTO | null = null;
  statCards: StatCard[] = [];
  summaryLoading = false;

  // ---- Table ----
  rows: PurchaseReportRowDTO[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 50;
  tableLoading = false;

  // ---- Export ----
  excelExporting = false;
  pdfExporting = false;

  // ---- Error ----
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: PurchaseReportService,
    public pageHeaderService: PageHeaderService,
  ) { }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Purchase Report');
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
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filterForm = this.fb.group({
      dateFrom:     [this.formatDate(firstDay)],
      dateTo:       [this.formatDate(now)],
      status:       [''],
      supplierName: [''],
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
    this.errorMessage = null;

    this.reportService.getSummary(this.f)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.summary = res;
          this.buildStatCards(res);
          this.summaryLoading = false;
        },
        error: err => {
          this.errorMessage = err.message;
          this.summaryLoading = false;
        }
      });
  }

  private loadTable(): void {
    this.tableLoading = true;

    this.reportService.getReportPage({
      ...this.f,
      page: this.currentPage,
      size: this.pageSize,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: SpringPage<PurchaseReportRowDTO>) => {
          this.rows         = page.content;
          this.totalPages   = page.totalPages;
          this.totalElements = page.totalElements;
          this.tableLoading = false;
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

  private buildStatCards(s: PurchaseReportSummaryDTO): void {
    this.statCards = [
      { label: 'Total Orders',   value: s.totalOrders,             variant: 'default', icon: '📦' },
      { label: 'Total Cost',     value: this.money(s.totalAmount),  variant: 'default', icon: '💰' },
      { label: 'Total Paid',     value: this.money(s.totalPaid),    variant: 'success', icon: '✅' },
      { label: 'Total Due',      value: this.money(s.totalDue),     variant: 'danger',  icon: '⚠️' },
      { label: 'Total Discount', value: this.money(s.totalDiscount),variant: 'warning', icon: '🏷️' },
      { label: 'Total VAT',      value: this.money(s.totalVat),     variant: 'default', icon: '🧾' },
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
    this.pageSize   = size;
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

  statusClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      COMPLETED:  'badge-success',
      CANCELLED:  'badge-danger',
      PENDING:    'badge-warning',
      PROCESSING: 'badge-info',
    };
    return map[status] ?? 'badge-secondary';
  }

  get countByStatus(): { label: string; count: number }[] {
    if (!this.summary?.countByStatus) return [];
    return Object.entries(this.summary.countByStatus)
      .map(([label, count]) => ({ label, count }));
  }

  trackById(_: number, row: PurchaseReportRowDTO): number { return row.id; }
}