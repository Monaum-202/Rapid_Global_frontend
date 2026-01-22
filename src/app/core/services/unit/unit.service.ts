import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiResponse, PaginatedData } from 'src/app/core/models/api-response.model';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseService } from '../base/base.service';

export interface Unit {
  id: number;
  name: string;
  fullName: string;
  sqn: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitReqDto {
  name: string;
  fullName: string;
  sqn: number;
}

export interface UnitFilterParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnitService extends BaseService {
  private readonly ENDPOINT = 'unit';

  /**
   * Get all units (no pagination)
   */
  getAll(search?: string): Observable<BaseApiResponse<Unit[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.get<Unit[]>(this.ENDPOINT, params).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all active units
   */
  getAllActive(status: boolean): Observable<BaseApiResponse<Unit[]>> {
    let params = new HttpParams().set('status', status.toString());
    return this.get<Unit[]>(`${this.ENDPOINT}/all-active`, params).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single unit by ID
   */
  getById(id: number): Observable<BaseApiResponse<Unit>> {
    return this.get<Unit>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new unit
   */
  create(dto: UnitReqDto): Observable<BaseApiResponse<Unit>> {
    // this.validateUnitDto(dto);
    return this.post<Unit>(this.ENDPOINT, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing unit
   */
  update(id: number, dto: UnitReqDto): Observable<BaseApiResponse<Unit>> {
    // this.validateUnitDto(dto);
    return this.put<Unit>(`${this.ENDPOINT}/${id}`, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a unit
   */
  remove(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle unit active status
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Unit>> {
    return this.patch<Unit>(`${this.ENDPOINT}/${id}`, {}).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // // ==================== Helper Methods ====================

  // /**
  //  * Validate unit DTO before sending to backend
  //  */
  // private validateUnitDto(dto: UnitReqDto): void {
  //   if (!dto.name?.trim()) {
  //     throw new Error('Unit name is required');
  //   }
  //   if (!dto.fullName?.trim()) {
  //     throw new Error('Unit full name is required');
  //   }
  // }
}