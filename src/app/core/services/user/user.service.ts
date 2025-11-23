import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface User {
  id: number;
  userName: string;
  email: string;
  password?: string;
  fullName: string;
  isActive: boolean;
  country: string;
  phone: string;
  location: string;
  dateOfBirth: Date | null;
  thumbnail: Uint8Array | null;
  roleId: number | null;
  roleName: string;
}

export interface UserReqDto {
  userName: string;
  email: string;
  password?: string;
  fullName?: string;
  country?: string;
  phone?: string;
  location?: string;
  dateOfBirth?: Date | null;
  thumbnail?: Uint8Array | null;
  roleId: number;
}

export interface UserFilterParams {
  page?: number;
  size?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService {
  private readonly ENDPOINT = 'users';

  /**
   * Get all users with pagination and optional search
   */
  getAll(page = 0, size = 10, search?: string): Observable<BaseApiResponse<PaginatedData<User>>> {
    let params = this.buildPaginationParams(page, size);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.get<PaginatedData<User>>(this.ENDPOINT, params);
  }

  /**
   * Get a single user by ID
   */
  getById(id: number): Observable<BaseApiResponse<User>> {
    return this.get<User>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create a new user
   */
  create(dto: UserReqDto): Observable<BaseApiResponse<User>> {
    return this.post<User>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing user
   */
  update(id: number, dto: UserReqDto): Observable<BaseApiResponse<User>> {
    return this.put<User>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Delete a user
   */
  deleteUser(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Update user status (active/inactive)
   */
  updateStatus(id: number, isActive: boolean): Observable<BaseApiResponse<User>> {
    return this.patch<User>(`${this.ENDPOINT}/${id}/status?isActive=${isActive}`, {});
  }

   activeUpdate(id: number): Observable<BaseApiResponse<User>> {
      return this.patch<User>(`${this.ENDPOINT}/${id}`, {});
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
   * Build filter parameters for advanced search (future use)
   */
  private buildFilterParams(filters: UserFilterParams): HttpParams {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return params;
  }
}