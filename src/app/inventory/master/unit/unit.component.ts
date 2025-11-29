import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Unit, UnitReqDto, UnitService } from 'src/app/core/services/unit/unit.service';

enum ModalType {
  VIEW = 'unitModal',
  FORM = 'unitFormModal' // Combined Add/Edit modal
}

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.css']
})
export class UnitComponent extends BaseCrudComponent<Unit, UnitReqDto> implements OnInit {
  entityName = 'Unit';
  entityNameLower = 'unit';
  isEditMode = false; // Track whether we're editing or adding

  columns: TableColumn<Unit>[] = [
    { key: 'id', label: 'SL', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'fullName', label: 'Full Name', visible: true },
    { key: 'sqn', label: 'Sequence Number', visible: false },
    { key: 'active', label: 'Status', visible: true }
  ];

  get units(): Unit[] {
    return this.items;
  }

  get selectedUnit(): Unit | null {
    return this.selectedItem;
  }

  set selectedUnit(value: Unit | null) {
    this.selectedItem = value;
  }

  get filteredUnits(): Unit[] {
    return this.items;
  }

  // Computed property for modal title
  get modalTitle(): string {
    return this.isEditMode ? 'Edit Unit' : 'Add New Unit';
  }

  // Computed property for submit button text
  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Add Unit';
  }

  constructor(
    public service: UnitService,
    public pageHeaderService: PageHeaderService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Unit List');
    this.loadItems();
  }

  createNew(): Unit {
    return {
      id: 0,
      name: '',
      fullName: '',
      sqn: 0,
      active: true
    };
  }

  isValid(unit: Unit | null): boolean {
    if (!unit) return false;
    return !!(unit.name && unit.fullName && unit.sqn !== undefined && unit.sqn !== null);
  }

  mapToDto(unit: Unit): UnitReqDto {
    return {
      name: unit.name,
      fullName: unit.fullName,
      sqn: unit.sqn
    };
  }

  // Open modal for adding new unit
  openAddModal(): void {
    this.isEditMode = false;
    this.selectedUnit = this.createNew();
  }

  // Open modal for editing existing unit
  editUnit(unit: Unit): void {
    this.isEditMode = true;
    this.editItem(unit);
  }

  viewUnit(unit: Unit): void {
    this.viewItem(unit);
  }

  // Single save method that handles both add and edit
  saveUnit(): void {
    if (!this.isValid(this.selectedUnit)) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const dto = this.mapToDto(this.selectedUnit!);
    this.isLoading = true;

    const operation = this.isEditMode && this.selectedUnit?.id
      ? this.service.update(this.selectedUnit.id, dto)
      : this.service.create(dto);

    operation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            const message = this.isEditMode
              ? 'Unit updated successfully'
              : 'Unit added successfully';
            this.handleCrudSuccess(message, ModalType.FORM);
          }
        },
        error: (error) => {
          const message = this.isEditMode
            ? 'Failed to update unit'
            : 'Failed to add unit';
          this.handleError(message, error);
        }
      });
  }

  deleteUnit(unit: Unit): void {
    this.deleteItem(unit, unit.name);
  }

  loadUnits(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  openDeleteModal(unit: Unit) {
    this.selectedUnit = unit;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('confirmDeleteModal')
    );
    modal.show();
  }

  confirmDelete() {
    if (this.selectedUnit) {
      this.deleteItem(this.selectedUnit, this.selectedUnit.name);
    }
  }
}