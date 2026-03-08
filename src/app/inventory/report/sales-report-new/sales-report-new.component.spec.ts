import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesReportNewComponent } from './sales-report-new.component';

describe('SalesReportNewComponent', () => {
  let component: SalesReportNewComponent;
  let fixture: ComponentFixture<SalesReportNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SalesReportNewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesReportNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
