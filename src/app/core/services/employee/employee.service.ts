import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface LendRecord {
  id: number;
  expenseId: string;
  categoryName: string;
  amount: number;
  paymentMethodName: string;
  date: string;
  description: string;
  employeeId: string;
  employeeName: string;
  paidTo: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedAt: string | null;
  approvedByName: string | null;
}

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  salary: number;
  joiningDate: string;
  sqn: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  lends?: LendRecord[];
  totalLend: number;
}

export interface EmployeeReqDto {
  name: string;
  email?: string;
  phone: string;
  salary: number;
  joiningDate: string;
  sqn: number;
}

export interface EmployeeFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends BaseService {
  private readonly ENDPOINT = 'employee';

  /**
   * Get all employees (no pagination)
   */
  getAll(search?: string): Observable<BaseApiResponse<Employee[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<Employee[]>(this.ENDPOINT, params).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all active employees
   */
  getAllActive(status: boolean): Observable<BaseApiResponse<Employee[]>> {
    let params = new HttpParams().set('status', status.toString());
    return this.get<Employee[]>(`${this.ENDPOINT}/all-active`, params).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single employee by ID
   */
  getById(id: number): Observable<BaseApiResponse<Employee>> {
    return this.get<Employee>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new employee
   */
  create(dto: EmployeeReqDto): Observable<BaseApiResponse<Employee>> {
    this.validateEmployeeDto(dto);
    return this.post<Employee>(this.ENDPOINT, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing employee
   */
  update(id: number, dto: EmployeeReqDto): Observable<BaseApiResponse<Employee>> {
    this.validateEmployeeDto(dto);
    return this.put<Employee>(`${this.ENDPOINT}/${id}`, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an employee
   */
  remove(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle employee active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Employee>> {
    return this.patch<Employee>(`${this.ENDPOINT}/${id}`, {}).pipe(
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
   * Validate employee DTO before sending to backend
   */
  private validateEmployeeDto(dto: EmployeeReqDto): void {
    if (!dto.name?.trim()) {
      throw new Error('Employee name is required');
    }

    if (dto.name.trim().length < 2) {
      throw new Error('Employee name must be at least 2 characters');
    }

    if (!dto.phone?.trim()) {
      throw new Error('Employee phone is required');
    }

    if (dto.phone.trim().length < 11) {
      throw new Error('Phone number must be at least 11 digits');
    }

    // Email validation (if provided)
    if (dto.email && dto.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        throw new Error('Please enter a valid email address');
      }
    }

    if (dto.salary === undefined || dto.salary === null) {
      throw new Error('Salary is required');
    }

    if (dto.salary < 0) {
      throw new Error('Salary cannot be negative');
    }

    if (!dto.joiningDate) {
      throw new Error('Joining date is required');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dto.joiningDate)) {
      throw new Error('Invalid joining date format (YYYY-MM-DD required)');
    }
  }

  /**
   * Build filter parameters for advanced search (future use)
   */
  private buildFilterParams(filters: EmployeeFilterParams): HttpParams {
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

  /**
   * Calculate total lend amount for an employee
   */
  calculateTotalLend(lends: LendRecord[]): number {
    return lends
      .filter(lend => lend.status === 'APPROVED')
      .reduce((sum, lend) => sum + lend.amount, 0);
  }
}