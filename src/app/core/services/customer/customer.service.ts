import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  altPhone?: number;
  email: string;
  address?: string;
  businessAddress?: string;
  totalTransaction?: number;
  active?: boolean;
  createdBy?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerReqDto {
  name: string;
  phone: string;
  altPhone?: number;
  email: string;
  address?: string;
  businessAddress?: string;
}

export interface CustomerFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService extends BaseService {
  private readonly ENDPOINT = 'customer';

  /**
   * Get all customers with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Customer>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<Customer>>(this.ENDPOINT, params);
  }

  /**
   * Get customers filtered by active status with pagination
   */
  getAllActive(
    active: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Customer>>> {
    const params = this.buildPaginationParams(page, size)
      .set('active', active.toString());

    return this.get<PaginatedData<Customer>>(`${this.ENDPOINT}/all-active`, params);
  }

  /**
   * Get a single customer by ID
   */
  getById(id: number): Observable<BaseApiResponse<Customer>> {
    return this.get<Customer>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new customer
   */
  create(dto: CustomerReqDto): Observable<BaseApiResponse<Customer>> {
    return this.post<Customer>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing customer
   */
  update(id: number, dto: CustomerReqDto): Observable<BaseApiResponse<Customer>> {
    return this.put<Customer>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete a customer
   */
  deleteCustomer(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle customer active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Customer>> {
    return this.patch<Customer>(`${this.ENDPOINT}/${id}`, {});
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
   * Build filter parameters for advanced search
   */
  private buildFilterParams(filters: CustomerFilterParams): HttpParams {
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