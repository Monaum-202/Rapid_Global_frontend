import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface EstimateItem {
  id?: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface Estimate {
  id: number;
  estimateNo: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  estimateDate: string;
  expiryDate: string;
  notes?: string;
  subTotal: number;
  vat: number;
  discount: number;
  totalAmount: number;
  status: string;
  convertedToSale?: boolean;
  saleId?: number;
  cancelReason?: string;
  items: EstimateItem[];
  createdBy?: number;
  createdByName?: string;
  createdDate?: string;
}

export interface EstimateReqDto {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  estimateDate: string;
  expiryDate: string;
  notes?: string;
  discount: number;
  vat: number;
  status: string;
  items: EstimateItem[];
}

export interface ConvertToSaleDto {
  sellDate?: string;
  deliveryDate?: string;
  notes?: string;
}

export interface EstimateFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstimateService extends BaseService {
  private readonly ENDPOINT = 'estimates';

  /**
   * Get all estimates with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Estimate>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<Estimate>>(this.ENDPOINT, params);
  }

  /**
   * Get a single estimate by ID
   */
  getById(id: number): Observable<BaseApiResponse<Estimate>> {
    return this.get<Estimate>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new estimate
   */
  create(dto: EstimateReqDto): Observable<BaseApiResponse<Estimate>> {
    return this.post<Estimate>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing estimate
   */
  update(id: number, dto: EstimateReqDto): Observable<BaseApiResponse<Estimate>> {
    return this.put<Estimate>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete an estimate
   */
  deleteEstimate(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }


  /**
   * Convert estimate to sale
   */
  convertToSale(id: number, dto?: ConvertToSaleDto): Observable<BaseApiResponse<number>> {
    return this.post<number>(`${this.ENDPOINT}/${id}/convert-to-sale`, dto || {});
  }

  /**
   * Cancel estimate with reason
   */
  cancelEstimate(id: number, reason: string): Observable<BaseApiResponse<Estimate>> {
    return this.put<Estimate>(`${this.ENDPOINT}/${id}/cancel`, reason);
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
   * Calculate totals for estimate items
   */
  calculateTotals(items: EstimateItem[], vat = 0, discount = 0): {
    subTotal: number;
    vatAmount: number;
    totalPrice: number;
  } {
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = (subTotal * vat) / 100;
    const totalPrice = subTotal + vatAmount - discount;

    return {
      subTotal,
      vatAmount,
      totalPrice
    };
  }
}