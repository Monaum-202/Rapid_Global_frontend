import { TestBed } from '@angular/core/testing';

import { ItemUsageService } from './item-usage.service';

describe('ItemUsageService', () => {
  let service: ItemUsageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemUsageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
