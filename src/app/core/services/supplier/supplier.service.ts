import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  contactPerson?: string;
  totalPurchases?: number;
  totalDue?: number;
  isActive: boolean;
  createdBy?: number;
  createdByName?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface SupplierReqDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  contactPerson?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService extends BaseService {
  private readonly ENDPOINT = 'suppliers';

  /**
   * Get all suppliers with pagination and search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Supplier>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<Supplier>>(this.ENDPOINT, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get active suppliers
   */
  getAllActive(
    active: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Supplier>>> {
    const params = this.buildPaginationParams(page, size)
      .set('active', active.toString());

    return this.get<PaginatedData<Supplier>>(`${this.ENDPOINT}/all-active`, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get supplier by ID
   */
  getById(id: number): Observable<BaseApiResponse<Supplier>> {
    return this.get<Supplier>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get supplier by phone number
   */
  getByPhone(phone: string): Observable<BaseApiResponse<Supplier>> {
    const params = new HttpParams().set('phone', phone);
    return this.get<Supplier>(`${this.ENDPOINT}/by-phone`, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create new supplier
   */
  create(dto: SupplierReqDto): Observable<BaseApiResponse<Supplier>> {
    this.validateSupplierDto(dto);
    return this.post<Supplier>(this.ENDPOINT, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update existing supplier
   */
  update(id: number, dto: SupplierReqDto): Observable<BaseApiResponse<Supplier>> {
    this.validateSupplierDto(dto);
    return this.put<Supplier>(`${this.ENDPOINT}/${id}`, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete a customer
   */
  deleteSupplier(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle supplier active status
   */
  toggleActive(id: number): Observable<BaseApiResponse<Supplier>> {
    return this.patch<Supplier>(`${this.ENDPOINT}/${id}/toggle-active`, {}).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // /**
  //  * Get supplier statistics
  //  */
  // getStatistics(id: number): Observable<BaseApiResponse<{
  //   totalPurchases: number;
  //   totalAmount: number;
  //   totalPaid: number;
  //   totalDue: number;
  //   lastPurchaseDate: string;
  // }>> {
  //   return this.get(`${this.ENDPOINT}/${id}/statistics`).pipe(
  //     catchError(error => throwError(() => error))
  //   );
  // }

  // ==================== Helper Methods ====================

  private buildPaginationParams(page: number, size: number): HttpParams {
    return new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
  }

  private validateSupplierDto(dto: SupplierReqDto): void {
    if (!dto.name?.trim()) {
      throw new Error('Supplier name is required');
    }

    if (!dto.phone?.trim()) {
      throw new Error('Phone number is required');
    }

    if (dto.phone.trim().length < 11) {
      throw new Error('Phone number must be at least 11 digits');
    }

    if (dto.email && dto.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        throw new Error('Invalid email format');
      }
    }
  }
}