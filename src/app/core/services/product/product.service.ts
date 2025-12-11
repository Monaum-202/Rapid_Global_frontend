import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiResponse } from 'src/app/core/models/api-response.model';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';

export enum ProductType {
  RAW_MATERIAL = 'RAW',
  FINISHED_GOODS = 'FINISHED_GOODS',
  SEMI_FINISHED = 'SEMI_FINISHED',
  CONSUMABLE = 'CONSUMABLE'
}

export interface Product {
  id: number;
  name: string;
  productType: ProductType;
  description?: string;
  unitId: number;
  unitName?: string;
  sortingOrder?: number;
  pricePerUnit?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReqDto {
  name: string;
  productType: ProductType;
  description?: string;
  unitId: number;
  sortingOrder?: number;
  pricePerUnit?: number;
}

export interface ProductFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
  productType?: ProductType;
  unitId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseService {
  private readonly ENDPOINT = 'product';

  /**
   * Get all products (no pagination)
   */
  getAll(search?: string): Observable<BaseApiResponse<Product[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<Product[]>(this.ENDPOINT, params);
  }

  /**
   * Get all active products
   */
  getAllActive(status: boolean): Observable<BaseApiResponse<Product[]>> {
    let params = new HttpParams().set('status', status.toString());
    return this.get<Product[]>(`${this.ENDPOINT}/all-active`, params);
  }


  /**
   * Get products with optional search and status filters
   */
  getAllProducts(search?: string, status?: boolean): Observable<BaseApiResponse<Product[]>> {
  let params = new HttpParams();

  if (search?.trim()) {
    params = params.set('search', search.trim());
  }

  if (status !== undefined) {
    params = params.set('status', status.toString());
  }

  // Make sure to call the BaseService `get` method
  return this.get<Product[]>(`${this.ENDPOINT}/all-active`, params);
}


  /**
   * Get products by type
   */
  getByType(productType: ProductType): Observable<BaseApiResponse<Product[]>> {
    let params = new HttpParams().set('productType', productType);
    return this.get<Product[]>(`${this.ENDPOINT}/by-type`, params);
  }

  /**
   * Get products by unit
   */
  getByUnit(unitId: number): Observable<BaseApiResponse<Product[]>> {
    return this.get<Product[]>(`${this.ENDPOINT}/by-unit/${unitId}`);
  }

  /**
   * Get a single product by ID
   */
  getById(id: number): Observable<BaseApiResponse<Product>> {
    return this.get<Product>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new product
   */
  create(dto: ProductReqDto): Observable<BaseApiResponse<Product>> {
    this.validateProductDto(dto);
    return this.post<Product>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing product
   */
  update(id: number, dto: ProductReqDto): Observable<BaseApiResponse<Product>> {
    this.validateProductDto(dto);
    return this.put<Product>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete a product
   */
  remove(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }


  /**
   * Toggle product active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Product>> {
    return this.patch<Product>(`${this.ENDPOINT}/${id}`, {});
  }

  // ==================== Helper Methods ====================

  /**
   * Validate product DTO before sending to backend
   */
  private validateProductDto(dto: ProductReqDto): void {
    if (!dto.name?.trim()) {
      throw new Error('Product name is required');
    }
    if (!dto.productType) {
      throw new Error('Product type is required');
    }
    if (!dto.unitId) {
      throw new Error('Unit is required');
    }
    if (dto.pricePerUnit !== undefined && dto.pricePerUnit <= 0) {
      throw new Error('Price must be greater than 0');
    }
  }

  /**
   * Get product type display name
   */
  getProductTypeDisplay(type: ProductType): string {
    const typeMap: Record<ProductType, string> = {
      [ProductType.RAW_MATERIAL]: 'Raw Material',
      [ProductType.FINISHED_GOODS]: 'Finished Goods',
      [ProductType.SEMI_FINISHED]: 'Semi-Finished',
      [ProductType.CONSUMABLE]: 'Consumable'
    };
    return typeMap[type] || type;
  }

  /**
   * Get all product types for dropdown
   */
  getProductTypes(): Array<{ value: ProductType; label: string }> {
    return Object.values(ProductType).map(type => ({
      value: type,
      label: this.getProductTypeDisplay(type)
    }));
  }
}