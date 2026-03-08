// sales-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

// models/sales-report.model.ts

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING';

export interface SalesReportRowDTO {
  id: number;
  invoiceNo: string;
  customerName: string;
  phone: string;
  sellDate: string;
  deliveryDate: string;
  itemCount: number;
  subTotal: number;
  discount: number;
  vat: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: OrderStatus;
}

export interface SalesReportSummaryDTO {
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  totalOrders: number;
  totalSubAmount: number;
  totalDiscount: number;
  totalVat: number;
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  countByStatus: Record<string, number>;
  rows: SalesReportRowDTO[] | null;
}

export interface SalesReportFilter {
  dateFrom: string;
  dateTo: string;
  status?: string;
  customerName?: string;
  page: number;
  size: number;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


@Injectable({ providedIn: 'root' })
export class SalesReportNewService extends BaseService {

  private readonly ENDPOINT = 'reports/sales';

  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * Paginated detail rows — for the table view
   */
  getReportPage(filter: SalesReportFilter): Observable<SpringPage<SalesReportRowDTO>> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      customerName: filter.customerName || '',
      page:         filter.page,
      size:         filter.size,
    });
    return this.http.get<SpringPage<SalesReportRowDTO>>(
      `${this.BASE_URL}/${this.ENDPOINT}`,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * Summary totals (stat cards) — wrapped in BaseApiResponse.
   */
  getSummary(filter: Partial<SalesReportFilter>): Observable<BaseApiResponse<SalesReportSummaryDTO>> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      customerName: filter.customerName || '',
    });
    return this.get<SalesReportSummaryDTO>(`${this.ENDPOINT}/summary`, params);
  }

  /** Download Excel */
  downloadExcel(filter: Partial<SalesReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      customerName: filter.customerName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/excel?${params}`,
      `Sales_Report_${filter.dateFrom}_${filter.dateTo}.xlsx`
    );
  }

  /** Download PDF */
  downloadPdf(filter: Partial<SalesReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      customerName: filter.customerName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/pdf?${params}`,
      `Sales_Report_${filter.dateFrom}_${filter.dateTo}.pdf`
    );
  }

  private triggerBlobDownload(url: string, filename: string): void {
    const token = this.getAuthToken();
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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
