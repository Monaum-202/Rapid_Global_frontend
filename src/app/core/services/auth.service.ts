import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface BaseApiResponse<T> {
  status: number | string;
  message: string;
  data: T;
  timestamp: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth`;
  // protected readonly BASE_URL = `${environment.apiUrl}/api`;
  private currentUserSubject: BehaviorSubject<boolean>;
  public isAuthenticated: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    this.currentUserSubject = new BehaviorSubject<boolean>(!!token);
    this.isAuthenticated = this.currentUserSubject.asObservable();
  }

  // Login method
  login(login: string, password: string): Observable<BaseApiResponse<AuthResponse>> {
    return this.http.post<BaseApiResponse<AuthResponse>>(`${this.API_URL}/authenticate`, { login, password })
      .pipe(
        tap(response => {
          // Accept both number and string statuses
          if ((response.status === 200 || response.status === 'success') && response.data) {
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            this.currentUserSubject.next(true);
          }
        })
      );
  }


  // Logout method
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Check if user is authenticated
  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiry;
    } catch (e) {
      return false;
    }
  }

  // Refresh token
  refreshToken(): Observable<BaseApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<BaseApiResponse<AuthResponse>>(`${this.API_URL}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          if (response.status === 'success' && response.data) {
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
          }
        })
      );
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  getRoleId(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.roleId || null;
  }

  getUserId(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.userId || null;
  }

}