// income-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';

export type IncomeStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

export interface IncomeReportRowDTO {
  id: number;
  incomeId: string;
  categoryName: string;
  paymentMethod: string;
  paidFrom: string;
  paidFromCompany: string;
  invoiceNo: string | null;
  amount: number;
  incomeDate: string;
  description: string;
  status: IncomeStatus;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface IncomeReportSummaryDTO {
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  totalRecords: number;
  totalAmount: number;
  totalApproved: number;
  totalPending: number;
  countByStatus: Record<string, number>;
  countByCategory: Record<string, number>;
  rows: IncomeReportRowDTO[] | null;
}

export interface IncomeReportFilter {
  dateFrom: string;
  dateTo: string;
  status?: string;
  paidFrom?: string;
  categoryName?: string;
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
export class IncomeReportService extends BaseService {

  private readonly ENDPOINT = 'reports/incomes';

  constructor(http: HttpClient) {
    super(http);
  }

  /** Paginated detail rows */
  getReportPage(filter: IncomeReportFilter): Observable<SpringPage<IncomeReportRowDTO>> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidFrom:     filter.paidFrom     || '',
      categoryName: filter.categoryName || '',
      page:         filter.page,
      size:         filter.size,
    });
    return this.http.get<SpringPage<IncomeReportRowDTO>>(
      `${this.BASE_URL}/${this.ENDPOINT}`,
      { headers: this.getHeaders(), params }
    );
  }

  /** Summary totals for stat cards */
  getSummary(filter: Partial<IncomeReportFilter>): Observable<IncomeReportSummaryDTO> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidFrom:     filter.paidFrom     || '',
      categoryName: filter.categoryName || '',
    });
    return this.http.get<IncomeReportSummaryDTO>(
      `${this.BASE_URL}/${this.ENDPOINT}/summary`,
      { headers: this.getHeaders(), params }
    );
  }

  /** Download Excel */
  downloadExcel(filter: Partial<IncomeReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidFrom:     filter.paidFrom     || '',
      categoryName: filter.categoryName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/excel?${params}`,
      `Income_Report_${filter.dateFrom}_${filter.dateTo}.xlsx`
    );
  }

  /** Download PDF */
  downloadPdf(filter: Partial<IncomeReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      paidFrom:     filter.paidFrom     || '',
      categoryName: filter.categoryName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/pdf?${params}`,
      `Income_Report_${filter.dateFrom}_${filter.dateTo}.pdf`
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