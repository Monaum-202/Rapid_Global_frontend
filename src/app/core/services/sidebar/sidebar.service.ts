import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiResponse } from '../../models/api-response.model';
import { BaseService } from '../base/base.service';

export interface SidebarMenu {
  id: number;
  name: string;
  route: string;
}

export interface SidebarModule {
  id: number;
  name: string;
  icon: string;
  menus: SidebarMenu[];
}

@Injectable({
  providedIn: 'root'
})
export class SidebarService extends BaseService {

  private readonly ENDPOINT = 'sidebar';

  /**
   * Get sidebar modules & menus based on logged-in user
   */
  getSidebar(): Observable<BaseApiResponse<SidebarModule[]>> {
    return this.get<SidebarModule[]>(this.ENDPOINT).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
