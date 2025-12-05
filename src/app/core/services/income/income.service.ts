import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';
import { AddPaymentDto } from '../sales/sales.service';

export interface Income {
  id: number;
  incomeId: string;
  categoryId: number;
  categoryName: string;
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  paidFrom: string;
  paidFromCompany: string;
  incomeDate: string;
  description: string;
  approvedByName?: string;
  approvalDate?: string;
  cancelReason?: string;
  status: string;
  createdBy: number;
  createdByName: string;
}

export interface IncomeReqDto {
  incomeCategory: number;
  incomeDate: string;
  amount: number;
  paymentMethodId: number;
  paidFrom?: string;
  paidFromCompany?: string;
  status?: string;
  approvalDate?: string;
  description?: string;
}

export interface IncomeFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncomeService extends BaseService {
  private readonly ENDPOINT = 'income';

  /**
   * Get all incomes with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Income>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<Income>>(this.ENDPOINT, params);
  }

  /**
   * Get incomes filtered by active with pagination
   */
  getAllActive(
    active: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Income>>> {
    const params = this.buildPaginationParams(page, size)
      .set('active', active.toString());

    return this.get<PaginatedData<Income>>(`${this.ENDPOINT}/all-active`, params);
  }

  /**
   * Get a single income by ID
   */
  getById(id: number): Observable<BaseApiResponse<Income>> {
    return this.get<Income>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new income
   */
  create(dto: IncomeReqDto): Observable<BaseApiResponse<Income>> {
    return this.post<Income>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing income
   */
  update(id: number, dto: IncomeReqDto): Observable<BaseApiResponse<Income>> {
    return this.put<Income>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete an income
   */
  deleteIncome(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle income active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Income>> {
    return this.patch<Income>(`${this.ENDPOINT}/${id}`, {});
  }

  /**
   * Approve an income
   */
  approveIncome(id: number): Observable<BaseApiResponse<Income>> {
    return this.put<Income>(`${this.ENDPOINT}/${id}/approve`, {});
  }

  /**
   * Cancel an income with reason
   */
  cancelIncome(id: number, reason: string): Observable<BaseApiResponse<Income>> {
    return this.put<Income>(`${this.ENDPOINT}/${id}/cancel`, reason);
  }

  addPayment(dto: AddPaymentDto): Observable<BaseApiResponse<Income>> {
  return this.put<Income>(`${this.ENDPOINT}/${dto.saleId}/payments`, dto);
}
  // ==================== Helper Methods ====================

  /**
   * Build pagination parameters
   */
  private buildPaginationParams(page: number, size: number): HttpParams {
    return new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
  }

  /**
   * Build filter parameters for advanced search (future use)
   */
  private buildFilterParams(filters: IncomeFilterParams): HttpParams {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }

    if (filters.active !== undefined) {
      params = params.set('active', filters.active.toString());
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return params;
  }
}