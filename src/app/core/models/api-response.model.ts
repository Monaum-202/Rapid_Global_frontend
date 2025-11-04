// Base API response wrapper
export interface BaseApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface PaginatedData<T> {
  current_page: number;
  data: T[];          // list of items
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}
