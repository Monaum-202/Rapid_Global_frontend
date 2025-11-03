// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:9091/api/auth';
  private readonly TOKEN_KEY = 'auth_token'; // Consistent key name
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<any> {
  return this.http.post<any>(`${this.API_URL}/authenticate`, credentials)
    .pipe(
      tap(response => {
        const accessToken = response?.data?.access_token;
        const refreshToken = response?.data?.refresh_token;

        if (accessToken) {
          this.setToken(accessToken);
          if (refreshToken) {
            this.setRefreshToken(refreshToken);
          }
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
}


  logout(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY); // Fixed: use TOKEN_KEY
    return token !== null && token !== undefined && token !== '';
  }

  isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}


  // isAuthenticated(): boolean {
  //   const token = localStorage.getItem(this.TOKEN_KEY); // Fixed: use TOKEN_KEY
  //   if (!token) return false;

  //   // Optional: check token expiry if using JWT
  //   try {
  //     const payload = JSON.parse(atob(token.split('.')[1]));
  //     const isExpired = payload.exp * 1000 < Date.now();
  //     if (isExpired) {
  //       this.clearTokens();
  //       return false;
  //     }
  //   } catch (error) {
  //     // If token parsing fails, assume invalid
  //     return false;
  //   }

  //   return true;
  // }

  // Optional: Add a method to refresh the token
  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }
}