import { Injectable } from '@angular/core';
import { BaseApiResponse, PaginatedData } from '../../models/api-response.model';


@Injectable({ providedIn: 'root' })
export class PaginationHandlerService {
  handleResponse<T>(response: BaseApiResponse<PaginatedData<T>>) {
    const { data } = response;
    return {
      items: data?.data || [],
      totalPages: data?.last_page || 0,
      totalElements: data?.total || 0,
    };
  }
}
