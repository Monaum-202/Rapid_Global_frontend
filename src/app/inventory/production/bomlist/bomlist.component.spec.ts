import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BOMListComponent } from './bomlist.component';

describe('BOMListComponent', () => {
  let component: BOMListComponent;
  let fixture: ComponentFixture<BOMListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BOMListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BOMListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
