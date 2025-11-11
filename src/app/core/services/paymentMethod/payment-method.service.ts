import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  sqn: number;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface PaymentMethodReqDto {
  name: string;
  description: string;
  sqn: number;
}

export interface PaymentMethodFilterParams {
  page?: number;
  size?: number;
  status?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService extends BaseService {
  private readonly ENDPOINT = 'paymentMethod';

  /**
   * Get all paymentMethods with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<PaymentMethod>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<PaymentMethod>>(this.ENDPOINT, params);
  }

  /**
   * Get paymentMethods filtered by status with pagination
   */
  getAllActive(
    status: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<PaymentMethod>>> {
    const params = this.buildPaginationParams(page, size)
      .set('status', status.toString());

    return this.get<PaginatedData<PaymentMethod>>(`${this.ENDPOINT}/all-active`, params);
  }

  /**
   * Get a single paymentMethod by ID
   */
  getById(id: number): Observable<BaseApiResponse<PaymentMethod>> {
    return this.get<PaymentMethod>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new paymentMethod
   */
  create(dto: PaymentMethodReqDto): Observable<BaseApiResponse<PaymentMethod>> {
    this.validatePaymentMethodDto(dto);
    return this.post<PaymentMethod>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing paymentMethod
   */
  update(id: number, dto: PaymentMethodReqDto): Observable<BaseApiResponse<PaymentMethod>> {
    this.validatePaymentMethodDto(dto);
    return this.put<PaymentMethod>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete an paymentMethod
   */
  deletePaymentMethod(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle paymentMethod status
   */
  statusUpdate(id: number): Observable<BaseApiResponse<PaymentMethod>> {
    return this.patch<PaymentMethod>(`${this.ENDPOINT}/${id}/status`, {});
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
   * Validate paymentMethod DTO before sending to backend
   */
  private validatePaymentMethodDto(dto: PaymentMethodReqDto): void {
    if (!dto.name?.trim()) {
      throw new Error('PaymentMethod name is required');
    }
  }

  /**
   * Build filter parameters for advanced search (future use)
   */
  private buildFilterParams(filters: PaymentMethodFilterParams): HttpParams {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }

    if (filters.status !== undefined) {
      params = params.set('status', filters.status.toString());
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return params;
  }
}