import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import {
  ProfitLossReportDTO,
  MonthlyBreakdownDTO,
  CategoryBreakdownDTO,
  ProfitLossReportService
} from 'src/app/core/services/Report/profit-loss-report.service';

@Component({
  selector: 'app-profit-loss-report',
  templateUrl: './profit-loss-report.component.html',
  styleUrls: ['./profit-loss-report.component.css']
})
export class ProfitLossReportComponent implements OnInit, OnDestroy {

  filterForm!: FormGroup;

  report: ProfitLossReportDTO | null = null;
  loading        = false;
  excelExporting = false;
  pdfExporting   = false;
  errorMessage: string | null = null;

  // View toggle for bottom section
  activeTab: 'monthly' | 'category' = 'monthly';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ProfitLossReportService,
    public  pageHeaderService: PageHeaderService,
  ) { }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Profit & Loss');
    this.buildForm();
    this.loadReport();
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
    const firstDay = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year

    this.filterForm = this.fb.group({
      dateFrom: [this.fmt(firstDay), Validators.required],
      dateTo:   [this.fmt(now),      Validators.required],
    });
  }

  get f() { return this.filterForm.value; }

  // ----------------------------------------------------------------
  // Load
  // ----------------------------------------------------------------

  loadReport(): void {
    if (this.filterForm.invalid) return;
    this.loading      = true;
    this.errorMessage = null;

    this.reportService.getReport(this.f.dateFrom, this.f.dateTo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.report  = res;
          this.loading = false;
        },
        error: err => {
          this.errorMessage = err.message;
          this.loading      = false;
        }
      });
  }

  // ----------------------------------------------------------------
  // Quick-select presets
  // ----------------------------------------------------------------

  setPreset(preset: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): void {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to   = now;
        break;
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to   = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        from = new Date(now.getFullYear(), 0, 1);
        to   = now;
        break;
      case 'lastYear':
        from = new Date(now.getFullYear() - 1, 0, 1);
        to   = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    this.filterForm.setValue({ dateFrom: this.fmt(from), dateTo: this.fmt(to) });
    this.loadReport();
  }

  // ----------------------------------------------------------------
  // Exports
  // ----------------------------------------------------------------

  exportExcel(): void {
    if (!this.f.dateFrom || !this.f.dateTo) return;
    this.excelExporting = true;
    setTimeout(() => {
      this.reportService.downloadExcel(this.f.dateFrom, this.f.dateTo);
      setTimeout(() => this.excelExporting = false, 2500);
    }, 50);
  }

  exportPdf(): void {
    if (!this.f.dateFrom || !this.f.dateTo) return;
    this.pdfExporting = true;
    setTimeout(() => {
      this.reportService.downloadPdf(this.f.dateFrom, this.f.dateTo);
      setTimeout(() => this.pdfExporting = false, 2500);
    }, 50);
  }

  // ----------------------------------------------------------------
  // Template helpers
  // ----------------------------------------------------------------

  money(val: number | null | undefined): string {
    return (val ?? 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  absVal(val: number | null | undefined): number {
    return Math.abs(val ?? 0);
  }

  pct(val: number | null | undefined): string {
    return (val ?? 0).toFixed(1) + '%';
  }

  isProfit(): boolean {
    return (this.report?.netProfit ?? 0) >= 0;
  }

  /** Width of the inline bar chart (0–100) */
  barWidth(amount: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((amount / total) * 100));
  }

  trackByLabel(_: number, item: CategoryBreakdownDTO): string { return item.categoryName; }
  trackBySortKey(_: number, item: MonthlyBreakdownDTO): number  { return item.sortKey; }

  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}