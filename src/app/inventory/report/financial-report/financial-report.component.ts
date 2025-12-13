import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { FinancialTransaction, FinancialReportSummary, FinancialTrend, FinancialReportFilter, FinancialReportService } from 'src/app/core/services/Report/financial-report.service';
import { TransectionCategory, TransectionCategoryService } from 'src/app/core/services/transectionCategory/transection-category.service';

@Component({
  selector: 'app-financial-report',
  templateUrl: './financial-report.component.html',
  styleUrls: ['./financial-report.component.css']
})
export class FinancialReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = false;
  isLoadingSummary = false;
  isLoadingTrend = false;
  isExporting = false;

  // Data
  transactions: FinancialTransaction[] = [];
  summary: FinancialReportSummary | null = null;
  trends: FinancialTrend[] = [];

  // Filter options
  categories: TransectionCategory[] = [];
  paymentMethods: PaymentMethod[] = [];
  statusOptions = ['PENDING', 'APPROVED', 'CANCELLED'];
  transactionTypeOptions = [
    { value: 'ALL', label: 'All Transactions' },
    { value: 'INCOME', label: 'Income Only' },
    { value: 'EXPENSE', label: 'Expense Only' }
  ];
  quickDateRanges: { label: string; startDate: string; endDate: string }[] = [];

  // Filters
  filters: FinancialReportFilter = {
    startDate: this.getFirstDayOfMonth(),
    endDate: this.getTodayDate()
  };

  // Pagination
  currentPage = 0;
  pageSize = 50;
  totalElements = 0;
  totalPages = 0;

  // View toggle
  activeView: 'summary' | 'table' | 'trend' = 'summary';

  // Error handling
  errorMessage = '';

  constructor(
    private financialReportService: FinancialReportService,
    private pageHeaderService: PageHeaderService,
    private categoryService: TransectionCategoryService,
    private paymentMethodService: PaymentMethodService
  ) {}

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Financial Report');
    this.loadCategories();
    this.loadPaymentMethods();
    this.quickDateRanges = this.financialReportService.getQuickDateRanges();
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.financialReportService.getReport(this.filters, this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.transactions = response.data.content || [];
            this.totalElements = response.data.totalElements || 0;
            this.totalPages = response.data.totalPages || 0;
            this.currentPage = response.data.number || 0;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load report';
          console.error('Error loading report:', error);
        }
      });
  }

  loadSummary(): void {
    this.isLoadingSummary = true;
    this.errorMessage = '';

    this.financialReportService.getSummary(this.filters.startDate, this.filters.endDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSummary = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.summary = response.data;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load summary';
          console.error('Error loading summary:', error);
        }
      });
  }

  loadTrend(): void {
    if (!this.filters.startDate || !this.filters.endDate) {
      this.errorMessage = 'Please select start and end dates';
      return;
    }

    this.isLoadingTrend = true;
    this.errorMessage = '';

    this.financialReportService.getTrend(this.filters.startDate, this.filters.endDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingTrend = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.trends = response.data;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load trend';
          console.error('Error loading trend:', error);
        }
      });
  }

  loadCategories(): void {
    this.categoryService.getAllActive(true, "INCOME").subscribe({
      next: (res) => {
        this.categories = res.data || [];
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllActive(true).subscribe({
      next: (res) => {
        this.paymentMethods = res.data || [];
      },
      error: (err) => {
        console.error('Failed to load payment methods', err);
      }
    });
  }

  // ============================================
  // FILTER ACTIONS
  // ============================================

  applyFilters(): void {
    this.currentPage = 0;

    if (this.activeView === 'table') {
      this.loadReport();
    } else if (this.activeView === 'summary') {
      this.loadSummary();
    } else if (this.activeView === 'trend') {
      this.loadTrend();
    }
  }

  resetFilters(): void {
    this.filters = {
      startDate: this.getFirstDayOfMonth(),
      endDate: this.getTodayDate()
    };
    this.applyFilters();
  }

  applyQuickDateRange(range: { label: string; startDate: string; endDate: string }): void {
    this.filters.startDate = range.startDate;
    this.filters.endDate = range.endDate;
    this.applyFilters();
  }

  // ============================================
  // VIEW SWITCHING
  // ============================================

  switchView(view: 'summary' | 'table' | 'trend'): void {
    this.activeView = view;

    if (view === 'table' && this.transactions.length === 0) {
      this.loadReport();
    } else if (view === 'summary' && !this.summary) {
      this.loadSummary();
    } else if (view === 'trend' && this.trends.length === 0) {
      this.loadTrend();
    }
  }

  // ============================================
  // PAGINATION
  // ============================================

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadReport();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadReport();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadReport();
    }
  }

  onPageSizeChange(event: any): void {
    this.pageSize = parseInt(event.target.value, 10);
    this.currentPage = 0;
    this.loadReport();
  }

  getPageNumbers(): number[] {
    const maxPages = 5;
    const pages: number[] = [];
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  // ============================================
  // EXPORT
  // ============================================

  exportReport(format: 'csv' | 'json' = 'csv'): void {
    this.isExporting = true;
    this.errorMessage = '';

    this.financialReportService.exportReport(this.filters, format)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isExporting = false)
      )
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `financial-report-${this.getTodayDate()}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.errorMessage = 'Failed to export report';
          console.error('Export error:', error);
        }
      });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  getFirstDayOfMonth(): string {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.formatDate(firstDay);
  }

  getTodayDate(): string {
    return this.formatDate(new Date());
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-success';
      case 'PENDING':
        return 'bg-warning';
      case 'CANCELLED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getTransactionTypeBadgeClass(type: string): string {
    return type === 'INCOME' ? 'bg-success' : 'bg-danger';
  }

  getTransactionTypeIcon(type: string): string {
    return type === 'INCOME' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle';
  }
}