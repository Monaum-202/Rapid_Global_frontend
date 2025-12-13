import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface FinancialReportFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  paymentMethodId?: number;
  status?: string;
  transactionType?: 'INCOME' | 'EXPENSE';
  searchTerm?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface FinancialTransaction {
  id: number;
  transactionId: string;
  transactionType: 'INCOME' | 'EXPENSE';
  categoryName: string;
  amount: number;
  paymentMethodName: string;
  counterparty: string;
  counterpartyCompany: string;
  transactionDate: string;
  description: string;
  status: string;
  approvedByName: string;
  createdByName: string;
  salesInvoiceNo: string;
  cancelReason: string;
  createdDate: string;
}

export interface CategoryBreakdown {
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  paymentMethodName: string;
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
  transactionCount: number;
}

export interface CounterpartyBreakdown {
  counterpartyName: string;
  counterpartyCompany: string;
  totalAmount: number;
  transactionCount: number;
}

export interface FinancialReportSummary {
  // Income
  totalIncome: number;
  approvedIncome: number;
  pendingIncome: number;
  cancelledIncome: number;
  totalIncomeTransactions: number;
  approvedIncomeTransactions: number;

  // Expense
  totalExpense: number;
  approvedExpense: number;
  pendingExpense: number;
  cancelledExpense: number;
  totalExpenseTransactions: number;
  approvedExpenseTransactions: number;

  // Net
  netProfit: number;
  netProfitPercentage: number;
  totalCashFlow: number;

  // Breakdowns
  incomeCategories: CategoryBreakdown[];
  expenseCategories: CategoryBreakdown[];
  paymentMethodBreakdowns: PaymentMethodBreakdown[];
  topIncomeCounterparties: CounterpartyBreakdown[];
  topExpenseCounterparties: CounterpartyBreakdown[];

  // Date range
  startDate: string;
  endDate: string;
}

export interface FinancialTrend {
  date: string;
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
  incomeCount: number;
  expenseCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialReportService extends BaseService {
  private readonly ENDPOINT = 'financial-reports';

  /**
   * Get combined financial report (Income + Expense)
   */
  getReport(
    filters: FinancialReportFilter,
    page = 0,
    size = 50
  ): Observable<BaseApiResponse<PaginatedData<FinancialTransaction>>> {
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
    if (filters.transactionType) {
      params = params.set('transactionType', filters.transactionType);
    }
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }
    if (filters.minAmount !== undefined) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount !== undefined) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }

    return this.get<PaginatedData<FinancialTransaction>>(this.ENDPOINT, params);
  }

  /**
   * Get financial summary (Net Profit, etc.)
   */
  getSummary(
    startDate?: string,
    endDate?: string
  ): Observable<BaseApiResponse<FinancialReportSummary>> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.get<FinancialReportSummary>(`${this.ENDPOINT}/summary`, params);
  }

  /**
   * Get financial trend (Income vs Expense)
   */
  getTrend(
    startDate: string,
    endDate: string
  ): Observable<BaseApiResponse<FinancialTrend[]>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.get<FinancialTrend[]>(`${this.ENDPOINT}/trend`, params);
  }

  /**
   * Export report as CSV
   */
  exportReport(filters: FinancialReportFilter, format = 'csv'): Observable<Blob> {
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
    if (filters.transactionType) {
      params = params.set('transactionType', filters.transactionType);
    }
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }
    if (filters.minAmount !== undefined) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount !== undefined) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }

    const urlWithParams = `${this.ENDPOINT}/export?${params.toString()}`;
    return this.downloadFile(urlWithParams, `financial-report.${format}`);
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