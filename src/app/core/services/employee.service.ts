import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  salary: number;
  joiningDate: string;
  sqn: number;
  status: boolean;
}

export interface EmployeeReqDto {
  name: string;
  email?: string;
  phone: string;
  salary: number;
  joiningDate: string;
  sqn: number;
}

export interface BaseApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface PageResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:9091/api/employee';

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10): Observable<BaseApiResponse<PageResponse<Employee>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<BaseApiResponse<PageResponse<Employee>>>(this.apiUrl, { params });
  }

  // Get all active/inactive employees with pagination
  getAllActive(status: boolean, page: number = 0, size: number = 10): Observable<BaseApiResponse<PageResponse<Employee>>> {
    const params = new HttpParams()
      .set('status', status.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<BaseApiResponse<PageResponse<Employee>>>(`${this.apiUrl}/all-active`, { params });
  }

  // Get employee by ID
  getById(id: number): Observable<BaseApiResponse<Employee>> {
    return this.http.get<BaseApiResponse<Employee>>(`${this.apiUrl}/${id}`);
  }

  // Create new employee
  create(dto: EmployeeReqDto): Observable<BaseApiResponse<Employee>> {
    return this.http.post<BaseApiResponse<Employee>>(this.apiUrl, dto);
  }

  // Update employee
  update(id: number, dto: EmployeeReqDto): Observable<BaseApiResponse<Employee>> {
    return this.http.put<BaseApiResponse<Employee>>(`${this.apiUrl}/${id}`, dto);
  }

  // Delete employee
  delete(id: number): Observable<BaseApiResponse<void>> {
    return this.http.delete<BaseApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Update employee status
  statusUpdate(id: number): Observable<BaseApiResponse<Employee>> {
    return this.http.patch<BaseApiResponse<Employee>>(`${this.apiUrl}/${id}/status`, {});
  }
}