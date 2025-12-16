import { Injectable } from '@angular/core';
import { HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface PurchaseItem {
  id?: number;
  rawMaterialId?: number;
  rawMaterialName: string;
  unitName: string;
  quantity: number;
  receivedQuantity?: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchasePayment {
  expenseId?: string;
  amount: number;
  paymentDate: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  trackingId?: string;
  description?: string;
  createdBy?: string;
}

export interface Purchase {
  id: number;
  purchaseNo: string;
  supplierId?: number;
  supplierName: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  contactPerson?: string;
  purchaseDate: string;
  deliveryDate?: string;
  receivedDate?: string;
  notes?: string;
  subTotal: number;
  vat: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string; // PENDING, PARTIAL_RECEIVED, RECEIVED, COMPLETED, CANCELLED
  items: PurchaseItem[];
  payments?: PurchasePayment[];
  cancelReason?: string;
  createdBy?: number;
  createdByName?: string;
  createdDate?: string;
}

export interface PurchaseReqDto {
  supplierId?: number;
  supplierName: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  contactPerson?: string;
  purchaseDate: string;
  deliveryDate?: string | null;
  receivedDate?: string | null;
  notes?: string;
  discount: number;
  vat: number;
  status: string;
  items: PurchaseItem[];
  payments?: {
    amount: number;
    paymentMethodId: number;
    paymentDate: string;
    description?: string;
    trackingId?: string;
  }[];
}

export interface ReceiveGoodsDto {
  purchaseId: number;
  receivedDate: string;
  items: {
    purchaseItemId: number;
    receivedQuantity: number;
  }[];
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService extends BaseService {
  private readonly ENDPOINT = 'purchase';

  /**
   * Get all purchases with pagination and search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Purchase>>> {
    let params = this.buildPaginationParams(page, size);
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<PaginatedData<Purchase>>(this.ENDPOINT, params);
  }

  /**
   * Get purchases by status
   */
  getByStatus(
    status: string,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Purchase>>> {
    const params = this.buildPaginationParams(page, size)
      .set('status', status);
    return this.get<PaginatedData<Purchase>>(`${this.ENDPOINT}/by-status`, params);
  }

  /**
   * Get purchase by ID
   */
  getById(id: number): Observable<BaseApiResponse<Purchase>> {
    return this.get<Purchase>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new purchase
   */
  create(dto: PurchaseReqDto): Observable<BaseApiResponse<Purchase>> {
    this.validatePurchaseDto(dto);
    return this.post<Purchase>(this.ENDPOINT, dto);
  }

  /**
   * Update purchase
   */
  update(id: number, dto: PurchaseReqDto): Observable<BaseApiResponse<Purchase>> {
    this.validatePurchaseDto(dto);
    return this.put<Purchase>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete purchase
   */
  deletePurchase(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Receive goods (update inventory)
   */
  receiveGoods(dto: ReceiveGoodsDto): Observable<BaseApiResponse<Purchase>> {
    return this.post<Purchase>(`${this.ENDPOINT}/receive-goods`, dto);
  }

  /**
   * Add payment to purchase
   */
  addPayment(dto: {
    purchaseId: number;
    amount: number;
    paymentDate: string;
    paymentMethodId: number;
    trackingId?: string;
    description?: string;
  }): Observable<BaseApiResponse<Purchase>> {
    return this.post<Purchase>(`${this.ENDPOINT}/add-payment`, dto);
  }

  /**
   * Cancel purchase
   */
  cancelPurchase(id: number, reason: string): Observable<BaseApiResponse<Purchase>> {
    return this.put<Purchase>(`${this.ENDPOINT}/${id}/cancel`, { reason });
  }

  /**
   * Download purchase order PDF
   */
  downloadPurchaseOrder(id: number): Observable<HttpResponse<Blob>> {
    return this.getBlob(`${this.ENDPOINT}/${id}/purchase-order`);
  }

  /**
   * Email purchase order to supplier
   */
  emailPurchaseOrder(id: number, email: string): Observable<BaseApiResponse<string>> {
    const params = new HttpParams().set('email', email);
    return this.post<string>(`${this.ENDPOINT}/${id}/email`, null, params);
  }

  /**
   * Get purchases by supplier
   */
  getBySupplier(
    supplierId: number,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Purchase>>> {
    const params = this.buildPaginationParams(page, size);
    return this.get<PaginatedData<Purchase>>(`${this.ENDPOINT}/supplier/${supplierId}`, params);
  }

  /**
   * Get pending/due purchases
   */
  getPendingPurchases(
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Purchase>>> {
    const params = this.buildPaginationParams(page, size);
    return this.get<PaginatedData<Purchase>>(`${this.ENDPOINT}/pending`, params);
  }

  // ==================== Helper Methods ====================

  private buildPaginationParams(page: number, size: number): HttpParams {
    return new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
  }

  private validatePurchaseDto(dto: PurchaseReqDto): void {
    if (!dto.supplierName?.trim()) {
      throw new Error('Supplier name is required');
    }

    if (!dto.phone?.trim()) {
      throw new Error('Phone number is required');
    }

    if (dto.phone.trim().length < 11) {
      throw new Error('Phone number must be at least 11 digits');
    }

    if (!dto.purchaseDate) {
      throw new Error('Purchase date is required');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }

    dto.items.forEach((item, index) => {
      if (!item.rawMaterialName?.trim()) {
        throw new Error(`Item ${index + 1}: Material name is required`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitPrice < 0) {
        throw new Error(`Item ${index + 1}: Unit price cannot be negative`);
      }
    });
  }

  /**
   * Calculate purchase totals
   */
  calculateTotals(items: PurchaseItem[], vat = 0, discount = 0): {
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
      totalPrice: totalPrice < 0 ? 0 : totalPrice
    };
  }

  /**
   * Calculate paid and due amounts
   */
  calculatePaymentStatus(totalAmount: number, paidAmount: number): {
    dueAmount: number;
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  } {
    const dueAmount = totalAmount - paidAmount;
    let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';

    if (paidAmount === 0) {
      paymentStatus = 'UNPAID';
    } else if (dueAmount > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'PAID';
    }

    return {
      dueAmount: dueAmount < 0 ? 0 : dueAmount,
      paymentStatus
    };
  }
}