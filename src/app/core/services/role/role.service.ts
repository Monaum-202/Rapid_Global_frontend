import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Role {
  id: number;
  name: string;
  description?: string;
  dateCreated?: string;
  lastUpdated?: string;
  authorities?: Array<{ authority: string }>;
  active: boolean; // For UI compatibility with BaseCrudComponent
}

export interface RoleDto {
  name: string;
}

export interface Menu {
  id: number;
  name: string;
  route: string;
}

export interface AppModule {
  id: number;
  name: string;
  menus: Menu[];
}

export interface RolePermissionRequest {
  roleId: number;
  moduleIds: number[];
  menuIds: number[];
}


@Injectable({
  providedIn: 'root'
})
export class RoleService extends BaseService {
  private readonly ENDPOINT = 'roles';
  private readonly PERMISSION_ENDPOINT = 'sidebar';


  // 🔹 all modules + menus (admin screen)
  getModulesWithMenus() {
    return this.get<AppModule[]>('modules/with-menus');
  }

  // 🔹 assigned permissions for a role
  getRolePermissions(roleId: number) {
    return this.get<AppModule[]>(`sidebar/${roleId}`);
  }

  // 🔹 save permissions
  saveRolePermissions(payload: RolePermissionRequest) {
    return this.post<void>('sidebar', payload);
  }

  /**
   * Get all roles with optional search
   */
  getAll(search?: string): Observable<BaseApiResponse<PaginatedData<Role>>> {
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '100');

    if (search) {
      params = params.set('search', search);
    }

    return this.get<PaginatedData<Role>>(this.ENDPOINT, params);
  }

  /**
   * Create a new role
   */
  create(dto: RoleDto): Observable<BaseApiResponse<Role>> {
    return this.post<Role>(this.ENDPOINT, dto);
  }

  /**
   * Update an existing role
   */
  update(id: number, dto: RoleDto): Observable<BaseApiResponse<Role>> {
    return this.put<Role>(`${this.ENDPOINT}/${id}`, dto);
  }

  /**
   * Toggle active status of a role
   */
  activeUpdate(id: number): Observable<BaseApiResponse<Role>> {
    return this.patch<Role>(`${this.ENDPOINT}/${id}/active`, {});
  }

  /**
   * Delete a role
   */
  remove(id: number): Observable<BaseApiResponse<void>> {
    return this.delete<void>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Get role by ID
   */
  getById(id: number): Observable<BaseApiResponse<Role>> {
    return this.get<Role>(`${this.ENDPOINT}/${id}`);
  }
  /**
   * Update role permissions
   */
  updateRolePermissions(request: RolePermissionRequest): Observable<BaseApiResponse<void>> {
    return this.post<void>(`${this.PERMISSION_ENDPOINT}/update`, request);
  }
}