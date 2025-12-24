import { TestBed } from '@angular/core/testing';

import { BomService } from './bom.service';

describe('BomService', () => {
  let service: BomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
