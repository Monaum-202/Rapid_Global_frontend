import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface ItemDTO {
  productId: number;
  itemName: string;
  unitName: string;
  quantity: number;
  note?: string;
}

// export interface StockTransaction{
//   id: number;
//   productId: number;
//    productName: string;
//    transactionType: string;
//    quantity: number;
//    balanceAfter: number;
//    transactionDate: string;
//    referenceType: string;
//    referenceNumber: string;
//    note: string;
// }

export interface ItemUsage {
  id: number;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  items: ItemDTO[];
  createdBy?: string;
  createdDate?: string;
  usageNo?: string;

  productId?: number;
   productName?: string;
   transactionType?: string;
   quantity?: number;
   balanceAfter?: number;
   transactionDate?: string;
   referenceType?: string;
   referenceNumber?: string;
   note?: string;
}

export interface ItemUsageReqDto {
  date: string;
  status: string;
  items: ItemDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class ItemUsageService extends BaseService {
  private readonly ENDPOINT = 'stock';

  /**
   * Get all item usages with pagination
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<ItemUsage>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<ItemUsage>>(`${this.ENDPOINT}/transection`, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get item usage by ID
   */
  getById(id: number): Observable<BaseApiResponse<ItemUsage>> {
    return this.get<ItemUsage>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create new stock out
   */
  stockOut(dto: ItemUsageReqDto): Observable<BaseApiResponse<ItemUsage>> {
    this.validateItemUsageDto(dto);
    return this.post<ItemUsage>(`${this.ENDPOINT}`, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create method (alias for stockOut to satisfy CrudService interface)
   */
  create(dto: ItemUsageReqDto): Observable<BaseApiResponse<ItemUsage>> {
    return this.stockOut(dto);
  }

  /**
   * Update item usage
   */
  update(id: number, dto: ItemUsageReqDto): Observable<BaseApiResponse<ItemUsage>> {
    this.validateItemUsageDto(dto);
    return this.put<ItemUsage>(`${this.ENDPOINT}/${id}`, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete item usage
   */
  deleteItemUsage(id: number): Observable<BaseApiResponse<void>> {
    return this.http.delete<BaseApiResponse<void>>(`${this.BASE_URL}/${this.ENDPOINT}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Cancel item usage with reason
   */
  cancel(id: number, reason: string): Observable<BaseApiResponse<ItemUsage>> {
    return this.put<ItemUsage>(`${this.ENDPOINT}/${id}/cancel`, reason).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get all with custom filters
   */
  getAllWithFilters(filters: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  }): Observable<BaseApiResponse<PaginatedData<ItemUsage>>> {
    let params = new HttpParams();

    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.get<PaginatedData<ItemUsage>>(this.ENDPOINT, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // Helper Methods
  private buildPaginationParams(page: number, size: number): HttpParams {
    return new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
  }

  private validateItemUsageDto(dto: ItemUsageReqDto): void {
    if (!dto.date) {
      throw new Error('Date is required');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }

    dto.items.forEach((item, index) => {
      if (!item.productId) {
        throw new Error(`Item ${index + 1}: Product is required`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });
  }
}