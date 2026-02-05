import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import {
  SalesReportService,
  SalesReportFilter,
  SalesReportResponse,
  ProductPerformance,
  CustomerAnalytics
} from 'src/app/core/services/Report/sales-report.service';

@Component({
  selector: 'app-sales-reports',
  templateUrl: './sales-reports.component.html',
  styleUrls: ['./sales-reports.component.css']
})
export class SalesReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = false;
  isLoadingProducts = false;
  isLoadingCustomers = false;
  isExporting = false;

  // Data
  reportData: SalesReportResponse | null = null;
  productPerformance: ProductPerformance | null = null;
  customerAnalytics: CustomerAnalytics | null = null;
  Math = Math;

  // Filter options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  groupByOptions = [
    { value: '', label: 'No Grouping' },
    { value: 'DAY', label: 'By Day' },
    { value: 'WEEK', label: 'By Week' },
    { value: 'MONTH', label: 'By Month' },
    { value: 'YEAR', label: 'By Year' }
  ];

  quickDateRanges: { label: string; startDate: string; endDate: string }[] = [];

  // Filters
  filters: SalesReportFilter = {
    startDate: this.getFirstDayOfMonth(),
    endDate: this.getTodayDate(),
    useMaterializedView: true,
    useCache: true
  };

  // Pagination
  currentPage = 0;
  pageSize = 20;

  // View toggle
  activeView: 'dashboard' | 'table' | 'products' | 'customers' = 'dashboard';

  // Error handling
  errorMessage = '';

  constructor(
    private salesReportService: SalesReportService,
    private pageHeaderService: PageHeaderService
  ) { }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Sales Report');
    this.quickDateRanges = this.salesReportService.getQuickDateRanges();
    this.loadReport();
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

    this.salesReportService.getReport(this.filters, this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.reportData = response.data;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load sales report';
          console.error('Error loading report:', error);
        }
      });
  }

  loadProductPerformance(): void {
    this.isLoadingProducts = true;
    this.errorMessage = '';

    this.salesReportService.getProductPerformance(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.status,
      10
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProducts = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.productPerformance = response.data;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load product performance';
          console.error('Error loading products:', error);
        }
      });
  }

  loadCustomerAnalytics(): void {
    this.isLoadingCustomers = true;
    this.errorMessage = '';

    this.salesReportService.getCustomerAnalytics(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.status,
      10
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCustomers = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.customerAnalytics = response.data;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load customer analytics';
          console.error('Error loading customers:', error);
        }
      });
  }

  // ============================================
  // FILTER ACTIONS
  // ============================================

  applyFilters(): void {
    this.currentPage = 0;

    if (this.activeView === 'dashboard' || this.activeView === 'table') {
      this.loadReport();
    }

    if (this.activeView === 'products') {
      this.loadProductPerformance();
    }

    if (this.activeView === 'customers') {
      this.loadCustomerAnalytics();
    }
  }

  resetFilters(): void {
    this.filters = {
      startDate: this.getFirstDayOfMonth(),
      endDate: this.getTodayDate(),
      useMaterializedView: true,
      useCache: true
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

  switchView(view: 'dashboard' | 'table' | 'products' | 'customers'): void {
    this.activeView = view;

    if (view === 'dashboard' && !this.reportData) {
      this.loadReport();
    } else if (view === 'table' && !this.reportData) {
      this.loadReport();
    } else if (view === 'products' && !this.productPerformance) {
      this.loadProductPerformance();
    } else if (view === 'customers' && !this.customerAnalytics) {
      this.loadCustomerAnalytics();
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
    if (this.reportData?.pagination.hasNext) {
      this.currentPage++;
      this.loadReport();
    }
  }

  previousPage(): void {
    if (this.reportData?.pagination.hasPrevious) {
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
    if (!this.reportData?.pagination) return [];

    const maxPages = 5;
    const totalPages = this.reportData.pagination.totalPages;
    const pages: number[] = [];
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  get canGoPrevious(): boolean {
    return this.reportData?.pagination.hasPrevious || false;
  }

  get canGoNext(): boolean {
    return this.reportData?.pagination.hasNext || false;
  }

  // ============================================
  // EXPORT
  // ============================================

  exportReport(): void {
    this.isExporting = true;
    this.errorMessage = '';

    this.salesReportService.exportReport(this.filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isExporting = false)
      )
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `sales-report-${this.getTodayDate()}.xlsx`;
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
      case 'DELIVERED':
        return 'bg-success';
      case 'CONFIRMED':
        return 'bg-info';
      case 'SHIPPED':
        return 'bg-primary';
      case 'PENDING':
        return 'bg-warning';
      case 'CANCELLED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'bi-check-circle-fill';
      case 'CONFIRMED':
        return 'bi-check-circle';
      case 'SHIPPED':
        return 'bi-truck';
      case 'PENDING':
        return 'bi-clock';
      case 'CANCELLED':
        return 'bi-x-circle';
      default:
        return 'bi-circle';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
