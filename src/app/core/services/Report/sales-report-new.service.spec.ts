import { TestBed } from '@angular/core/testing';

import { SalesReportNewService } from './sales-report-new.service';

describe('SalesReportNewService', () => {
  let service: SalesReportNewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalesReportNewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
