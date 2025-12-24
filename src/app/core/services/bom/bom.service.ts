import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

// ==================== Enums ====================
export enum BOMStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// ==================== Interfaces ====================
export interface BOMItem {
  id?: number;
  rawMaterialId: number;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  notes?: string;
  isOptional?: boolean;
  sequenceOrder?: number;
  availableStock?: number;
}

export interface BOM {
  id: number;
  bomCode: string;
  bomName: string;
  finishedProductId: number;
  finishedProductName?: string;
  outputQuantity: number;
  outputUnit: string;
  description?: string;
  productionNotes?: string;
  estimatedCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  estimatedTimeMinutes: number;
  status: BOMStatus;
  isActive: boolean;
  isDefault: boolean;
  version: string;
  items: BOMItem[];
  createdByName?: string;
  createdDate?: string;
  updatedByName?: string;
  updatedDate?: string;
  approvedByName?: string;
  approvedDate?: string;
}

export interface BOMReqDto {
  bomName: string;
  finishedProductId: number;
  outputQuantity: number;
  outputUnit: string;
  description?: string;
  productionNotes?: string;
  laborCost: number;
  overheadCost: number;
  estimatedTimeMinutes: number;
  status?: BOMStatus;
  isDefault?: boolean;
  version?: string;
  items: BOMItemReqDto[];
}

export interface BOMItemReqDto {
  rawMaterialId: number;
  quantity: number;
  unit: string;
  notes?: string;
  isOptional?: boolean;
  sequenceOrder?: number;
}

export interface ProductionCostCalculation {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerUnit: number;
  batchQuantity: number;
  totalUnitsProduced: number;
}

// ==================== Service ====================
@Injectable({
  providedIn: 'root'
})
export class BOMService extends BaseService {
  private readonly ENDPOINT = 'bom';

  /**
   * Get all BOMs with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<BOM>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<BOM>>(this.ENDPOINT, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get BOMs filtered by active status
   */
  getAllActive(
    active: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<BOM>>> {
    const params = this.buildPaginationParams(page, size)
      .set('active', active.toString());

    return this.get<PaginatedData<BOM>>(`${this.ENDPOINT}/all-active`, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get BOMs by status
   */
  getByStatus(
    status: BOMStatus,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<BOM>>> {
    const params = this.buildPaginationParams(page, size)
      .set('status', status);

    return this.get<PaginatedData<BOM>>(`${this.ENDPOINT}/status`, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get a single BOM by ID
   */
  getById(id: number): Observable<BaseApiResponse<BOM>> {
    return this.get<BOM>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get BOMs for a specific finished product
   */
  getByFinishedProduct(productId: number): Observable<BaseApiResponse<BOM[]>> {
    return this.get<BOM[]>(`${this.ENDPOINT}/product/${productId}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get default BOM for a finished product
   */
  getDefaultBOM(productId: number): Observable<BaseApiResponse<BOM>> {
    return this.get<BOM>(`${this.ENDPOINT}/product/${productId}/default`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create a new BOM
   */
  create(dto: BOMReqDto): Observable<BaseApiResponse<BOM>> {
    this.validateBOMDto(dto);
    return this.post<BOM>(this.ENDPOINT, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing BOM
   */
  update(id: number, dto: BOMReqDto): Observable<BaseApiResponse<BOM>> {
    this.validateBOMDto(dto);
    return this.put<BOM>(`${this.ENDPOINT}/${id}`, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete a BOM
   */
  deleteBOM(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Approve a BOM
   */
  approve(id: number): Observable<BaseApiResponse<BOM>> {
    return this.put<BOM>(`${this.ENDPOINT}/${id}/approve`, {}).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Set BOM as default for the product
   */
  setAsDefault(id: number): Observable<BaseApiResponse<BOM>> {
    return this.put<BOM>(`${this.ENDPOINT}/${id}/set-default`, {}).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Clone a BOM with new version
   */
  clone(id: number, newVersion: string): Observable<BaseApiResponse<BOM>> {
    const params = new HttpParams().set('version', newVersion);
    return this.post<BOM>(`${this.ENDPOINT}/${id}/clone`, null, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Check if materials are available for production
   */
  checkMaterialAvailability(
    id: number,
    batchQuantity: number
  ): Observable<BaseApiResponse<boolean>> {
    const params = new HttpParams().set('batchQuantity', batchQuantity.toString());
    return this.get<boolean>(`${this.ENDPOINT}/${id}/check-availability`, params).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Calculate production cost for a batch
   */
  calculateProductionCost(
    id: number,
    batchQuantity: number
  ): Observable<BaseApiResponse<ProductionCostCalculation>> {
    const params = new HttpParams().set('batchQuantity', batchQuantity.toString());
    return this.get<ProductionCostCalculation>(
      `${this.ENDPOINT}/${id}/calculate-cost`,
      params
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update BOM status
   */
  updateStatus(id: number, status: BOMStatus): Observable<BaseApiResponse<BOM>> {
    return this.put<BOM>(`${this.ENDPOINT}/${id}/status`, { status }).pipe(
      catchError(error => throwError(() => error))
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
   * Validate BOM DTO before sending
   */
  private validateBOMDto(dto: BOMReqDto): void {
    if (!dto.bomName?.trim()) {
      throw new Error('BOM name is required');
    }

    if (!dto.finishedProductId) {
      throw new Error('Finished product is required');
    }

    if (!dto.outputQuantity || dto.outputQuantity <= 0) {
      throw new Error('Output quantity must be greater than 0');
    }

    if (!dto.outputUnit?.trim()) {
      throw new Error('Output unit is required');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one raw material is required');
    }

    // Validate items
    dto.items.forEach((item, index) => {
      if (!item.rawMaterialId) {
        throw new Error(`Item ${index + 1}: Raw material is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unit?.trim()) {
        throw new Error(`Item ${index + 1}: Unit is required`);
      }
    });
  }

  /**
   * Calculate total material cost
   */
  calculateMaterialCost(items: BOMItem[]): number {
    return items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }

  /**
   * Calculate total production cost
   */
  calculateTotalCost(
    materialCost: number,
    laborCost: number,
    overheadCost: number
  ): number {
    return materialCost + laborCost + overheadCost;
  }

  /**
   * Calculate cost per unit
   */
  calculateCostPerUnit(totalCost: number, outputQuantity: number): number {
    return outputQuantity > 0 ? totalCost / outputQuantity : 0;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: BOMStatus): string {
    const statusClasses: { [key in BOMStatus]: string } = {
      [BOMStatus.DRAFT]: 'bg-secondary',
      [BOMStatus.PENDING]: 'bg-warning',
      [BOMStatus.APPROVED]: 'bg-info',
      [BOMStatus.ACTIVE]: 'bg-success',
      [BOMStatus.INACTIVE]: 'bg-danger',
      [BOMStatus.ARCHIVED]: 'bg-dark'
    };
    return statusClasses[status] || 'bg-secondary';
  }

  /**
   * Format time in minutes to hours and minutes
   */
  formatProductionTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}