import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransectionCategoryComponent } from './transection-category.component';

describe('TransectionCategoryComponent', () => {
  let component: TransectionCategoryComponent;
  let fixture: ComponentFixture<TransectionCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransectionCategoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransectionCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
