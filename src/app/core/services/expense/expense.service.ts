
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Expense {
  id: number;
  expenseId:string;
  categoryId: number;
  categoryName: string;
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  paidTo: string;
  expenseDate: string;
  description: string;
  approvedBy?: string;
  approvalDate?: string;
  status: string;
}


// Define the DTO for creating/updating expenses
export interface ExpenseReqDto {

  expenseCategory: number;
  expenseDate: string;
  amount: number;
  paymentMethodId: number;
  paidTo?: string;
  status?: string;
  approvedBy?: string;
  approvalDate?: string;
  description?: string;
  attachment?: string;
}

export interface ExpenseFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService extends BaseService {
  private readonly ENDPOINT = 'expense';

  /**
   * Get all expenses with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<Expense>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<Expense>>(this.ENDPOINT, params);
  }

  /**
   * Get expenses filtered by active with pagination
   */
  getAllActive(
    active: boolean,
    page = 0,
    size = 10
  ): Observable<BaseApiResponse<PaginatedData<Expense>>> {
    const params = this.buildPaginationParams(page, size)
      .set('active', active.toString());

    return this.get<PaginatedData<Expense>>(`${this.ENDPOINT}/all-active`, params);
  }

  /**
   * Get a single expense by ID
   */
  getById(id: number): Observable<BaseApiResponse<Expense>> {
    return this.get<Expense>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new expense
   */
  create(dto: ExpenseReqDto): Observable<BaseApiResponse<Expense>> {
    this.validateExpenseDto(dto);
    return this.post<Expense>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing expense
   */
  update(id: number, dto: ExpenseReqDto): Observable<BaseApiResponse<Expense>> {
    this.validateExpenseDto(dto);
    return this.put<Expense>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete an expense
   */
  deleteExpense(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle expense active
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Expense>> {
    return this.patch<Expense>(`${this.ENDPOINT}/${id}`, {});
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
   * Validate expense DTO before sending to backend
   */
  private validateExpenseDto(dto: ExpenseReqDto): void {
    if (!dto.paidTo?.trim()) {
      throw new Error('Expense name is required');
    }
  }

  /**
   * Build filter parameters for advanced search (future use)
   */
  private buildFilterParams(filters: ExpenseFilterParams): HttpParams {
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