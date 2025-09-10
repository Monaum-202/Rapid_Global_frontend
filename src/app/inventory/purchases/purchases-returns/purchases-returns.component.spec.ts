import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchasesReturnsComponent } from './purchases-returns.component';

describe('PurchasesReturnsComponent', () => {
  let component: PurchasesReturnsComponent;
  let fixture: ComponentFixture<PurchasesReturnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchasesReturnsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchasesReturnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
