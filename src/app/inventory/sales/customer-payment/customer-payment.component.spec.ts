import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPaymentComponent } from './customer-payment.component';

describe('CustomerPaymentComponent', () => {
  let component: CustomerPaymentComponent;
  let fixture: ComponentFixture<CustomerPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerPaymentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
