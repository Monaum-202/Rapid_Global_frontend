import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface Role {
  id: number;
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

}