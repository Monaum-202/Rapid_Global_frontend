import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Role {
  id: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService extends BaseService {
  private readonly ENDPOINT = 'roles';

  /**
   * Get all roles with pagination
   */
  getAll(page = 0, size = 100): Observable<BaseApiResponse<PaginatedData<Role>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.get<PaginatedData<Role>>(this.ENDPOINT, params);
  }

  /**
   * Get a single role by ID
   */
  getById(id: number): Observable<BaseApiResponse<Role>> {
    return this.get<Role>(`${this.ENDPOINT}/${id}`);
  }
}