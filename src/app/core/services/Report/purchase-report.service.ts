// purchase-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING';

export interface PurchaseReportRowDTO {
  id: number;
  invoiceNo: string;
  supplierName: string;
  phone: string;
  purchaseDate: string;
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

export interface PurchaseReportSummaryDTO {
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
  rows: PurchaseReportRowDTO[] | null;
}

export interface PurchaseReportFilter {
  dateFrom: string;
  dateTo: string;
  status?: string;
  supplierName?: string;
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
export class PurchaseReportService extends BaseService {

  private readonly ENDPOINT = 'reports/purchases';

  constructor(http: HttpClient) {
    super(http);
  }

  /** Paginated detail rows — for the table view */
  getReportPage(filter: PurchaseReportFilter): Observable<SpringPage<PurchaseReportRowDTO>> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      supplierName: filter.supplierName || '',
      page:         filter.page,
      size:         filter.size,
    });
    return this.http.get<SpringPage<PurchaseReportRowDTO>>(
      `${this.BASE_URL}/${this.ENDPOINT}`,
      { headers: this.getHeaders(), params }
    );
  }

  /** Summary totals — for stat cards */
  getSummary(filter: Partial<PurchaseReportFilter>): Observable<PurchaseReportSummaryDTO> {
    const params = this.buildParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      supplierName: filter.supplierName || '',
    });
    return this.http.get<PurchaseReportSummaryDTO>(
      `${this.BASE_URL}/${this.ENDPOINT}/summary`,
      { headers: this.getHeaders(), params }
    );
  }

  /** Download Excel */
  downloadExcel(filter: Partial<PurchaseReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      supplierName: filter.supplierName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/excel?${params}`,
      `Purchase_Report_${filter.dateFrom}_${filter.dateTo}.xlsx`
    );
  }

  /** Download PDF */
  downloadPdf(filter: Partial<PurchaseReportFilter>): void {
    const params = new URLSearchParams({
      dateFrom:     filter.dateFrom     || '',
      dateTo:       filter.dateTo       || '',
      status:       filter.status       || '',
      supplierName: filter.supplierName || '',
    });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/pdf?${params}`,
      `Purchase_Report_${filter.dateFrom}_${filter.dateTo}.pdf`
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