import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface IncomeReportFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  paymentMethodId?: number;
  status?: string;
  paidFrom?: string;
  minAmount?: number;
  maxAmount?: number;
  salesId?: number;
}

export interface IncomeReportItem {
  incomeId: string;
  categoryName: string;
  amount: number;
  paymentMethodName: string;
  paidFrom: string;
  paidFromCompany: string;
  incomeDate: string;
  description: string;
  active: string;
  approvedByName: string;
  createdByName: string;
  salesInvoiceNo: string;
  cancelReason: string;
}

export interface CategoryBreakdown {
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  paymentMethodName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface IncomeReportSummary {
  totalIncome: number;
  approvedIncome: number;
  pendingIncome: number;
  cancelledIncome: number;
  totalTransactions: number;
  approvedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  averageTransactionAmount: number;
  categoryBreakdowns: CategoryBreakdown[];
  paymentMethodBreakdowns: PaymentMethodBreakdown[];
  startDate: string;
  endDate: string;
}

export interface IncomeTrend {
  date: string;
  totalAmount: number;
  transactionCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class IncomeReportService extends BaseService {
  private readonly ENDPOINT = 'income-reports';

  /**
   * Get income report with filters and pagination
   */
  getReport(
    filters: IncomeReportFilter,
    page = 0,
    size = 50
  ): Observable<BaseApiResponse<PaginatedData<IncomeReportItem>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.paymentMethodId) {
      params = params.set('paymentMethodId', filters.paymentMethodId.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.paidFrom) {
      params = params.set('paidFrom', filters.paidFrom);
    }
    if (filters.minAmount !== undefined) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount !== undefined) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }
    if (filters.salesId) {
      params = params.set('salesId', filters.salesId.toString());
    }

    return this.get<PaginatedData<IncomeReportItem>>(this.ENDPOINT, params);
  }

  /**
   * Get income report summary/analytics
   */
  getSummary(
    startDate?: string,
    endDate?: string
  ): Observable<BaseApiResponse<IncomeReportSummary>> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.get<IncomeReportSummary>(`${this.ENDPOINT}/summary`, params);
  }

  /**
   * Get daily income trend
   */
  getTrend(
    startDate: string,
    endDate: string
  ): Observable<BaseApiResponse<IncomeTrend[]>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.get<IncomeTrend[]>(`${this.ENDPOINT}/trend`, params);
  }

  /**
   * Export report as CSV
   */
  exportReport(filters: IncomeReportFilter, format = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.paymentMethodId) {
      params = params.set('paymentMethodId', filters.paymentMethodId.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.paidFrom) {
      params = params.set('paidFrom', filters.paidFrom);
    }
    if (filters.minAmount !== undefined) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount !== undefined) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }
    if (filters.salesId) {
      params = params.set('salesId', filters.salesId.toString());
    }

    // Build URL with query params
    const urlWithParams = `${this.ENDPOINT}/export?${params.toString()}`;
    return this.downloadFile(urlWithParams, `income-report.${format}`);
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

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    ranges.push({
      label: 'Yesterday',
      startDate: this.formatDate(yesterday),
      endDate: this.formatDate(yesterday)
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