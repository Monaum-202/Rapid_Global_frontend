import { TestBed } from '@angular/core/testing';

import { PaginationHandlerService } from './pagination-handler.service';

describe('PaginationHandlerService', () => {
  let service: PaginationHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
