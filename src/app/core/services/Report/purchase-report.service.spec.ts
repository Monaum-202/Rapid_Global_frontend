import { TestBed } from '@angular/core/testing';

import { PurchaseReportService } from './purchase-report.service';

describe('PurchaseReportService', () => {
  let service: PurchaseReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchaseReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
