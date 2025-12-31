import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemUsageComponent } from './item-usage.component';

describe('ItemUsageComponent', () => {
  let component: ItemUsageComponent;
  let fixture: ComponentFixture<ItemUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemUsageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
