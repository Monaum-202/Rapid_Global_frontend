import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiResponse, PaginatedData } from 'src/app/core/models/api-response.model';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseService } from '../base/base.service';

export interface TransectionCategory {
  id: number;
  name: string;
  description: string;
  sqn: number;
  active: boolean;
  type: undefined;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransectionCategoryReqDto {
  name: string;
  description: string;
  type: undefined;
  sqn: number;
}

export interface TransectionCategoryFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransectionCategoryService extends BaseService {
  private readonly ENDPOINT = 'transection-category';

  /**
   * Get all transaction categories (no pagination)
   */
  getAll(search?: string): Observable<BaseApiResponse<TransectionCategory[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<TransectionCategory[]>(this.ENDPOINT, params).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all active transaction categories
   */
  getAllActive(
    status: boolean,
    type?: 'INCOME' | 'EXPENSE'
  ): Observable<BaseApiResponse<TransectionCategory[]>> {
    let params = new HttpParams().set('status', status.toString());
    if (type) {
      params = params.set('type', type);
    }
    return this.get<TransectionCategory[]>(`${this.ENDPOINT}/all-active`, params).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single transaction category by ID
   */
  getById(id: number): Observable<BaseApiResponse<TransectionCategory>> {
    return this.get<TransectionCategory>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new transaction category
   */
  create(dto: TransectionCategoryReqDto): Observable<BaseApiResponse<TransectionCategory>> {
    this.validateTransectionCategoryDto(dto);
    return this.post<TransectionCategory>(this.ENDPOINT, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing transaction category
   */
  update(id: number, dto: TransectionCategoryReqDto): Observable<BaseApiResponse<TransectionCategory>> {
    this.validateTransectionCategoryDto(dto);
    return this.put<TransectionCategory>(`${this.ENDPOINT}/${id}`, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a transaction category
   */
  remove(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle transaction category active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<TransectionCategory>> {
    return this.patch<TransectionCategory>(`${this.ENDPOINT}/${id}`, {}).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
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
   * Validate transaction category DTO before sending to backend
   */
  private validateTransectionCategoryDto(dto: TransectionCategoryReqDto): void {
    if (!dto.name?.trim()) {
      throw new Error('Transaction category name is required');
    }
    if (!dto.type) {
      throw new Error('Transaction category type is required');
    }
  }

  /**
   * Build filter parameters for advanced search (future use)
   */
  private buildFilterParams(filters: TransectionCategoryFilterParams): HttpParams {
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