import { Injectable } from '@angular/core';

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  sqn: number;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}
@
Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {

  constructor() { }
}
