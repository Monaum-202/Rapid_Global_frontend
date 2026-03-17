// expense-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

export interface ExpenseReportRowDTO {
  id: number;
  expenseId: string;
  categoryName: string;
  paymentMethod: string;
  transactionId: string | null;
  paidTo: string | null;
  paidToCompany: string | null;
  employeeName: string | null;
  invoiceNo: string | null;        // linked purchase invoice
  amount: number;
  expenseDate: string;
  description: string | null;
  status: ExpenseStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  createdByName: string | null;
}

export interface ExpenseReportSummaryDTO {
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  totalRecords: number;
  totalAmount: number;
  totalApproved: number;
  totalPending: number;
  countByStatus: Record<string, number>;
  countByCategory: Record<string, number>;
  rows: ExpenseReportRowDTO[] | null;
}

export interface ExpenseReportFilter {
  dateFrom: string;
  dateTo: string;
  status?: string;
  paidTo?: string;
  categoryName?: string;
  employeeName?: string;
  page: number;
  size: number;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Injectable({ providedIn: 'root' })
export class ExpenseReportService extends BaseService {

  private readonly ENDPOINT = 'reports/expenses';

  constructor(http: HttpClient) {
    super(http);
  }

  /** Paginated detail rows */
  getReportPage(filter: ExpenseReportFilter): Observable<SpringPage<ExpenseReportRowDTO>> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidTo:       filter.paidTo       || '',
      categoryName: filter.categoryName || '',
      employeeName: filter.employeeName || '',
      page:         filter.page,
      size:         filter.size,
    });
    return this.http.get<SpringPage<ExpenseReportRowDTO>>(
      `${this.BASE_URL}/${this.ENDPOINT}`,
      { headers: this.getHeaders(), params }
    );
  }

  /** Summary totals for stat cards */
  getSummary(filter: Partial<ExpenseReportFilter>): Observable<ExpenseReportSummaryDTO> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidTo:       filter.paidTo       || '',
      categoryName: filter.categoryName || '',
      employeeName: filter.employeeName || '',
    });
    return this.http.get<ExpenseReportSummaryDTO>(
      `${this.BASE_URL}/${this.ENDPOINT}/summary`,
      { headers: this.getHeaders(), params }
    );
  }

  /** Download Excel */
  downloadExcel(filter: Partial<ExpenseReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidTo:       filter.paidTo       || '',
      categoryName: filter.categoryName || '',
      employeeName: filter.employeeName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/excel?${params}`,
      `Expense_Report_${filter.dateFrom}_${filter.dateTo}.xlsx`
    );
  }

  /** Download PDF */
  downloadPdf(filter: Partial<ExpenseReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidTo:       filter.paidTo       || '',
      categoryName: filter.categoryName || '',
      employeeName: filter.employeeName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/pdf?${params}`,
      `Expense_Report_${filter.dateFrom}_${filter.dateTo}.pdf`
    );
  }

  private triggerBlobDownload(url: string, filename: string): void {
    const token = this.getAuthToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => {
        if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText}`);
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => console.error('Download error:', err));
  }
}