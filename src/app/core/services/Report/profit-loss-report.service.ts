// profit-loss-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';

export interface CategoryBreakdownDTO {
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyBreakdownDTO {
  monthLabel: string;
  sortKey: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export type LineType = 'SECTION_HEADER' | 'CATEGORY' | 'SUBTOTAL' | 'SPACER' | 'NET';

export interface ProfitLossLineItemDTO {
  lineType: LineType;
  label: string;
  amount: number | null;
  percentage: number | null;
  positive: boolean | null;
}

export interface ProfitLossReportDTO {
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  netLabel: string;
  netMarginPct: number;
  incomeByCategory: CategoryBreakdownDTO[];
  expenseByCategory: CategoryBreakdownDTO[];
  monthlyBreakdown: MonthlyBreakdownDTO[];
  lineItems: ProfitLossLineItemDTO[];
}

@Injectable({ providedIn: 'root' })
export class ProfitLossReportService extends BaseService {

  private readonly ENDPOINT = 'reports/profit-loss';

  constructor(http: HttpClient) {
    super(http);
  }

  getReport(dateFrom: string, dateTo: string): Observable<ProfitLossReportDTO> {
    const params = this.buildParams({ dateFrom, dateTo });
    return this.http.get<ProfitLossReportDTO>(
      `${this.BASE_URL}/${this.ENDPOINT}`,
      { headers: this.getHeaders(), params }
    );
  }

  downloadExcel(dateFrom: string, dateTo: string): void {
    const params = new URLSearchParams({ dateFrom, dateTo });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/excel?${params}`,
      `PL_Report_${dateFrom}_${dateTo}.xlsx`
    );
  }

  downloadPdf(dateFrom: string, dateTo: string): void {
    const params = new URLSearchParams({ dateFrom, dateTo });
    this.triggerBlobDownload(
      `${this.BASE_URL}/${this.ENDPOINT}/pdf?${params}`,
      `PL_Report_${dateFrom}_${dateTo}.pdf`
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