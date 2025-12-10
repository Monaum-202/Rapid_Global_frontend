import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface SalesItem {
  id?: number;
  itemName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  incomeId?: string;
  amount: number;
  incomeDate: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  trackingId?: string;
  description?: string;
  createdBy?: string;
}

export interface PaymentReqDto {
  incomeCategory?: number | null;
  amount: number;
  paymentMethodId: number;
  paidFrom?: string;
  paidFromCompany?: string;
  incomeDate: string;
  description?: string;
  trackingId?: string;
}

export interface Sales {
  id: number;
  invoiceNo: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  sellDate: string;
  deliveryDate?: string;
  notes?: string;
  subTotal: number;
  vat: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethodId: number;
  trackingId?: string;
  dueAmount: number;
  status: string;
  items: SalesItem[];
  payments?: Payment[];
  createdBy?: number;
  createdByName?: string;
  createdDate?: string;
}

export interface SalesReqDto {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  sellDate: string;
  deliveryDate?: string | null;
  notes?: string;
  discount: number;
  vat: number;
  paymentMethodId: number;
  status: string;
  items: SalesItem[];
  payments?: PaymentReqDto[];
}

export interface AddPaymentDto {
  saleId: number;
  amount: number;
  incomeDate: string;
  paymentMethodId: number;
  trackingId?: string;
  description?: string;
}

export interface SalesFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService extends BaseService {
  private readonly ENDPOINT = 'sales';

  /**
   * Get all sales with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Sales>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<Sales>>(this.ENDPOINT, params);
  }

  /**
   * Get sales filtered by active with pagination
   */
  getAllActive(
    active: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Sales>>> {
    const params = this.buildPaginationParams(page, size)
      .set('active', active.toString());

    return this.get<PaginatedData<Sales>>(`${this.ENDPOINT}/all-active`, params);
  }

  /**
   * Get a single sale by ID
   */
  getById(id: number): Observable<BaseApiResponse<Sales>> {
    return this.get<Sales>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new sale
   */
  create(dto: SalesReqDto): Observable<BaseApiResponse<Sales>> {
    return this.post<Sales>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing sale
   */
  update(id: number, dto: SalesReqDto): Observable<BaseApiResponse<Sales>> {
    return this.put<Sales>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete a sale
   */
  deleteSale(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle sale active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Sales>> {
    return this.patch<Sales>(`${this.ENDPOINT}/${id}`, {});
  }

  /**
   * Update sale status (e.g., PENDING, COMPLETED, CANCELED)
   */
  updateStatus(id: number, status: string): Observable<BaseApiResponse<Sales>> {
    return this.put<Sales>(`${this.ENDPOINT}/${id}/status`, { status });
  }

  /**
   * Approve payment for a sale
   */
  approvePayment(id: number): Observable<BaseApiResponse<Sales>> {
    return this.put<Sales>(`${this.ENDPOINT}/${id}/approve-payment`, {});
  }

  /**
   * Download invoice PDF for a sale
   */
  downloadInvoice(id: number): Observable<Blob> {
    return this.downloadFile(`sales/${id}/invoice`, `invoice_${id}.pdf`);
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
  private buildFilterParams(filters: SalesFilterParams): HttpParams {
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

    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }

    return params;
  }

  /**
   * Calculate totals for sales items
   */
  calculateTotals(items: SalesItem[], vat = 0, discount = 0): {
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

  /**
   * Calculate total paid amount from payments array
   */
  calculatePaidAmount(payments: Payment[]): number {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Calculate due amount
   */
  calculateDueAmount(totalAmount: number, paidAmount: number): number {
    const due = totalAmount - paidAmount;
    return due < 0 ? 0 : due;
  }
}