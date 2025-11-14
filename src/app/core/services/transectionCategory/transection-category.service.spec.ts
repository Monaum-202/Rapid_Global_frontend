import { TestBed } from '@angular/core/testing';

import { TransectionCategoryService } from './transection-category.service';

describe('TransectionCategoryService', () => {
  let service: TransectionCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransectionCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
