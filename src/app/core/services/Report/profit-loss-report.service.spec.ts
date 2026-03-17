import { TestBed } from '@angular/core/testing';

import { ProfitLossReportService } from './profit-loss-report.service';

describe('ProfitLossReportService', () => {
  let service: ProfitLossReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfitLossReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
