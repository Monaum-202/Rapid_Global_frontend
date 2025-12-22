import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Stock {
  id: number;
  productId: number;
  productName: string;
  unitName: string;
  currentQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStockLevel: number;
  averageCost: number;
  stockValue: number;
  stockStatus: 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';
}

export interface StockFilterParams {
  search?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService extends BaseService {
  private readonly ENDPOINT = 'stock';

  /**
   * Get all stock items
   */
  getAll(search?: string): Observable<BaseApiResponse<Stock[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<Stock[]>(this.ENDPOINT, params);
  }

  /**
   * Get a single stock item by ID
   */
  getById(id: number): Observable<BaseApiResponse<Stock>> {
    return this.get<Stock>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Get stock items by status
   */
  getByStatus(status: string): Observable<BaseApiResponse<Stock[]>> {
    const params = new HttpParams().set('status', status);
    return this.get<Stock[]>(`${this.ENDPOINT}/status`, params);
  }

  /**
   * Get low stock items
   */
  getLowStock(): Observable<BaseApiResponse<Stock[]>> {
    return this.get<Stock[]>(`${this.ENDPOINT}/low-stock`);
  }

  /**
   * Get out of stock items
   */
  getOutOfStock(): Observable<BaseApiResponse<Stock[]>> {
    return this.get<Stock[]>(`${this.ENDPOINT}/out-of-stock`);
  }

  /**
   * Build filter parameters for advanced search
   */
  private buildFilterParams(filters: StockFilterParams): HttpParams {
    let params = new HttpParams();

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return params;
  }
}