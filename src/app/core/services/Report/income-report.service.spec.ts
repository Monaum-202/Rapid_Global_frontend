import { TestBed } from '@angular/core/testing';

import { IncomeReportService } from './income-report.service';

describe('IncomeReportService', () => {
  let service: IncomeReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IncomeReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
