import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface SalesReportFilter {
  startDate?: string;
  endDate?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customerId?: number;
  customerName?: string;
  groupBy?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  useMaterializedView?: boolean;
  useCache?: boolean;
}

export interface SalesDetail {
  id: number;
  invoiceNo: string;
  sellDate: string;
  deliveryDate: string;
  customerName: string;
  phone: string;
  email: string;
  companyName: string;
  status: string;
  totalItems: number;
  subtotal: number;
  discount: number;
  vat: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string;
}

export interface SalesSummary {
  // Overall metrics
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  totalVat: number;
  netRevenue: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalCustomers: number;

  // Status breakdown
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  pendingAmount: number;
  confirmedAmount: number;
  deliveredAmount: number;
  cancelledAmount: number;
}

export interface GroupedSales {
  groupKey: string;
  groupLabel: string;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
}

export interface TopProduct {
  itemName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  orderCount: number;
  revenuePercentage: number;
}

export interface ProductPerformance {
  topProducts: TopProduct[];
  summary: {
    totalUniqueProducts: number;
    totalQuantitySold: number;
    totalRevenue: number;
  };
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  phone: string;
  email: string;
  companyName: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  firstOrderDate: string;
  daysSinceLastOrder: number;
}

export interface CustomerAnalytics {
  topCustomers: TopCustomer[];
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageLifetimeValue: number;
    averageOrderFrequency: number;
  };
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PerformanceMetrics {
  queryTimeMs: number;
  usedCache: boolean;
  usedMaterializedView: boolean;
  dataSource: 'CACHE' | 'MATERIALIZED_VIEW' | 'DATABASE';
}

export interface SalesReportResponse {
  summary: SalesSummary;
  salesDetails: SalesDetail[];
  pagination: PaginationInfo;
  groupedData?: GroupedSales[];
  metrics: PerformanceMetrics;
}

@Injectable({
  providedIn: 'root'
})
export class SalesReportService extends BaseService {
  private readonly ENDPOINT = 'sales-reports';

  /**
   * Get comprehensive sales report
   */
  getReport(
    filters: SalesReportFilter,
    page = 0,
    size = 20
  ): Observable<BaseApiResponse<SalesReportResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'sellDate')
      .set('sortDirection', 'DESC');

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.customerId) {
      params = params.set('customerId', filters.customerId.toString());
    }
    if (filters.customerName) {
      params = params.set('customerName', filters.customerName);
    }
    if (filters.groupBy) {
      params = params.set('groupBy', filters.groupBy);
    }
    if (filters.useMaterializedView !== undefined) {
      params = params.set('useMaterializedView', filters.useMaterializedView.toString());
    }
    if (filters.useCache !== undefined) {
      params = params.set('useCache', filters.useCache.toString());
    }

    return this.get<SalesReportResponse>(this.ENDPOINT, params);
  }

  /**
   * Get product performance report
   */
  getProductPerformance(
    startDate?: string,
    endDate?: string,
    status?: string,
    limit = 10
  ): Observable<BaseApiResponse<ProductPerformance>> {
    let params = new HttpParams().set('limit', limit.toString());

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.get<ProductPerformance>(`${this.ENDPOINT}/products`, params);
  }

  /**
   * Get customer analytics report
   */
  getCustomerAnalytics(
    startDate?: string,
    endDate?: string,
    status?: string,
    limit = 10
  ): Observable<BaseApiResponse<CustomerAnalytics>> {
    let params = new HttpParams().set('limit', limit.toString());

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.get<CustomerAnalytics>(`${this.ENDPOINT}/customers`, params);
  }

  /**
   * Export sales report to Excel
   */
  exportReport(filters: SalesReportFilter): Observable<Blob> {
    let params = new HttpParams();

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.customerId) {
      params = params.set('customerId', filters.customerId.toString());
    }
    if (filters.customerName) {
      params = params.set('customerName', filters.customerName);
    }
    if (filters.groupBy) {
      params = params.set('groupBy', filters.groupBy);
    }

    const urlWithParams = `${this.ENDPOINT}/export/excel?${params.toString()}`;
    return this.downloadFile(urlWithParams, `sales-report.xlsx`);
  }

  /**
   * Get quick date ranges
   */
  getQuickDateRanges(): { label: string; startDate: string; endDate: string }[] {
    const today = new Date();
    const ranges = [];

    // Today
    ranges.push({
      label: 'Today',
      startDate: this.formatDate(today),
      endDate: this.formatDate(today)
    });

    // This Week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    ranges.push({
      label: 'This Week',
      startDate: this.formatDate(startOfWeek),
      endDate: this.formatDate(today)
    });

    // This Month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    ranges.push({
      label: 'This Month',
      startDate: this.formatDate(startOfMonth),
      endDate: this.formatDate(today)
    });

    // Last Month
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    ranges.push({
      label: 'Last Month',
      startDate: this.formatDate(startOfLastMonth),
      endDate: this.formatDate(endOfLastMonth)
    });

    // This Quarter
    const quarter = Math.floor(today.getMonth() / 3);
    const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
    ranges.push({
      label: 'This Quarter',
      startDate: this.formatDate(startOfQuarter),
      endDate: this.formatDate(today)
    });

    // This Year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    ranges.push({
      label: 'This Year',
      startDate: this.formatDate(startOfYear),
      endDate: this.formatDate(today)
    });

    // Last Year
    const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
    ranges.push({
      label: 'Last Year',
      startDate: this.formatDate(startOfLastYear),
      endDate: this.formatDate(endOfLastYear)
    });

    return ranges;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}