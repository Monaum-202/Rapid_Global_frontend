import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { BaseApiResponse } from '../../models/api-response.model';

export interface RequestConfig {
  skipAuth?: boolean;
  retryCount?: number;
  customHeaders?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  protected readonly BASE_URL = 'http://localhost:9091/api';
  private readonly DEFAULT_RETRY_COUNT = 1;

  constructor(protected http: HttpClient) {}

  // ==================== HTTP Methods ====================

  protected get<T>(
    endpoint: string, 
    params?: HttpParams,
    config?: RequestConfig
  ): Observable<BaseApiResponse<T>> {
    return this.http.get<BaseApiResponse<T>>(
      this.buildUrl(endpoint), 
      {
        headers: this.getHeaders(config),
        params
      }
    ).pipe(
      retry(config?.retryCount ?? this.DEFAULT_RETRY_COUNT),
      catchError(this.handleError)
    );
  }

  protected post<T>(
    endpoint: string, 
    body: any,
    config?: RequestConfig
  ): Observable<BaseApiResponse<T>> {
    return this.http.post<BaseApiResponse<T>>(
      this.buildUrl(endpoint), 
      body, 
      {
        headers: this.getHeaders(config)
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  protected put<T>(
    endpoint: string, 
    body: any,
    config?: RequestConfig
  ): Observable<BaseApiResponse<T>> {
    return this.http.put<BaseApiResponse<T>>(
      this.buildUrl(endpoint), 
      body, 
      {
        headers: this.getHeaders(config)
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  protected patch<T>(
    endpoint: string, 
    body: any,
    config?: RequestConfig
  ): Observable<BaseApiResponse<T>> {
    return this.http.patch<BaseApiResponse<T>>(
      this.buildUrl(endpoint), 
      body, 
      {
        headers: this.getHeaders(config)
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  protected delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Observable<BaseApiResponse<T>> {
    return this.http.delete<BaseApiResponse<T>>(
      this.buildUrl(endpoint), 
      {
        headers: this.getHeaders(config)
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.BASE_URL}/${cleanEndpoint}`;
  }

  /**
   * Get headers with optional auth token
   */
  protected getHeaders(config?: RequestConfig): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Add authorization if not skipped
    if (!config?.skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Add custom headers if provided
    if (config?.customHeaders) {
      Object.entries(config.customHeaders).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Get authentication token from storage
   */
  protected getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Save authentication token to storage
   */
  protected saveAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Remove authentication token from storage
   */
  protected clearAuthToken(): void {
    localStorage.removeItem('access_token');
  }

  /**
   * Check if user is authenticated
   */
  protected isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          this.clearAuthToken();
          // You might want to redirect to login page here
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Validation error. Please check your input.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service unavailable. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    console.error('HTTP Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error,
      url: error.url
    });

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Build query parameters from object
   */
  protected buildParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    return httpParams;
  }

  /**
   * Download file from API
   */
  protected downloadFile(endpoint: string, filename: string): Observable<Blob> {
    return this.http.get(
      this.buildUrl(endpoint),
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Upload file to API
   */
  protected uploadFile(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>
  ): Observable<BaseApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Don't set Content-Type header for file upload (browser will set it with boundary)
    const token = this.getAuthToken();
    const headers = new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );

    return this.http.post<BaseApiResponse<any>>(
      this.buildUrl(endpoint), 
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }
}