import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BaseService } from '../base/base.service';
import { BaseApiResponse } from '../../models/api-response.model';

/* ==================== Backend Response Interfaces ==================== */

// Backend returns 'positive' (lowercase)
interface BackendMetricData {
  value: number;
  formattedValue: string;
  change: number;
  formattedChange: string;
  positive: boolean; // Backend uses 'positive'
}

interface BackendDashboardMetrics {
  totalRevenue: BackendMetricData;
  totalExpenses: BackendMetricData;
  netProfit: BackendMetricData;
  profitMargin: BackendMetricData;
  period: string;
  startDate: string;
  endDate: string;
}

/* ==================== Frontend Interfaces ==================== */

export interface MetricData {
  value: number;
  formattedValue: string;
  change: number;
  formattedChange: string;
  isPositive: boolean; // Frontend uses 'isPositive'
}

export interface DashboardMetrics {
  totalRevenue: MetricData;
  totalExpenses: MetricData;
  netProfit: MetricData;
  profitMargin: MetricData;
  period: string;
  startDate: string;
  endDate: string;
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  paymentMethodName: string;
  amount: number;
  count: number;
}

export interface RevenueDetails {
  totalRevenue: number;
  categoryBreakdown: CategoryBreakdown[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  period: string;
}

export interface ExpenseDetails {
  totalExpenses: number;
  categoryBreakdown: CategoryBreakdown[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  period: string;
}

export interface TrendPoint {
  date: string;
  amount: number;
  count: number;
}

export interface TrendData {
  revenueTrend: TrendPoint[];
  expenseTrend: TrendPoint[];
  period: string;
}

/* ==================== Service ==================== */

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseService {

  private readonly ENDPOINT = 'dashboard';

  /**
   * Transform backend metric to frontend format
   */
  private transformMetric(backendMetric: BackendMetricData): MetricData {
    return {
      value: backendMetric.value,
      formattedValue: backendMetric.formattedValue,
      change: backendMetric.change,
      formattedChange: backendMetric.formattedChange,
      isPositive: backendMetric.positive // Transform 'positive' to 'isPositive'
    };
  }

  /**
   * Transform backend metrics to frontend format
   */
  private transformMetrics(backendMetrics: BackendDashboardMetrics): DashboardMetrics {
    return {
      totalRevenue: this.transformMetric(backendMetrics.totalRevenue),
      totalExpenses: this.transformMetric(backendMetrics.totalExpenses),
      netProfit: this.transformMetric(backendMetrics.netProfit),
      profitMargin: this.transformMetric(backendMetrics.profitMargin),
      period: backendMetrics.period,
      startDate: backendMetrics.startDate,
      endDate: backendMetrics.endDate
    };
  }

  /**
   * Get main dashboard metrics
   */
  getDashboardMetrics(
    period: string = 'MONTH',
    startDate?: string,
    endDate?: string
  ): Observable<DashboardMetrics> {

    let params = new HttpParams().set('period', period);

    if (startDate) {
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.get<BackendDashboardMetrics>(
      `${this.ENDPOINT}/metrics`,
      params
    ).pipe(
      map((res: BaseApiResponse<BackendDashboardMetrics>) => {
        // Transform backend response to frontend format
        return this.transformMetrics(res.data);
      })
    );
  }

  /**
   * Get detailed revenue breakdown
   */
  getRevenueDetails(
    period: string = 'MONTH'
  ): Observable<BaseApiResponse<RevenueDetails>> {

    const params = new HttpParams().set('period', period);

    return this.get<RevenueDetails>(
      `${this.ENDPOINT}/revenue-details`,
      params
    );
  }

  /**
   * Get detailed expense breakdown
   */
  getExpenseDetails(
    period: string = 'MONTH'
  ): Observable<BaseApiResponse<ExpenseDetails>> {

    const params = new HttpParams().set('period', period);

    return this.get<ExpenseDetails>(
      `${this.ENDPOINT}/expense-details`,
      params
    );
  }

  /**
   * Get trend data for charts
   */
  getTrendData(
    period: string = 'MONTH'
  ): Observable<BaseApiResponse<TrendData>> {

    const params = new HttpParams().set('period', period);

    return this.get<TrendData>(
      `${this.ENDPOINT}/trends`,
      params
    );
  }
}