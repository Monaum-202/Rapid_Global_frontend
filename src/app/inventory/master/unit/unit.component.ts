import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { ToastService } from 'src/app/core/services/feature/toast.service';
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
    public pageHeaderService: PageHeaderService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Unit List');
    this.loadItems();
  }

  override createNew(): Unit {
    return {
      id: 0,
      name: '',
      fullName: '',
      sqn: 0,
      active: true
    };
  }

  override isValid(unit: Unit | null): boolean {
    if (!unit) return false;
    return !!(unit.name && unit.sqn !== undefined && unit.sqn !== null);
  }

  override mapToDto(unit: Unit): UnitReqDto {
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
      this.toastService.warning('Please fill in all required fields');
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
            this.toastService.success(response.message || (this.isEditMode ? 'Unit updated successfully' : 'Unit added successfully'));
            const message = this.isEditMode
              ? 'Unit updated successfully'
              : 'Unit added successfully';
            this.handleCrudSuccess(message, ModalType.FORM);
          } else {
            this.toastService.error(response.message || 'Operation failed');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || (this.isEditMode ? 'Failed to update unit' : 'Failed to add unit');
          this.toastService.error(errorMsg);
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
    if (!this.selectedUnit) {
      this.toastService.warning('No unit selected');
      return;
    }

    const id = this.selectedUnit.id;

    this.isLoading = true;
    this.service.remove(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || 'Unit deleted successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to delete unit');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to delete unit';
          this.toastService.error(errorMsg);
          this.handleError('Failed to delete unit', error);
        }
      });
  }

  override toggleActive(unit: Unit): void {
    this.isLoading = true;
    this.service.activeUpdate(unit.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || 'Status updated successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to toggle status');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to toggle status';
          this.toastService.error(errorMsg);
          this.handleError('Failed to toggle active status', error);
        }
      });
  }

  // Override base class error handling to clear old error messages
  override clearError(): void {
    this.errorMessage = '';
  }
}