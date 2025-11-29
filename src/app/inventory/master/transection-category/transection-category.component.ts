import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { TransectionCategory, TransectionCategoryReqDto, TransectionCategoryService } from 'src/app/core/services/transectionCategory/transection-category.service';

enum ModalType {
  VIEW = 'transectionCategoryModal',
  FORM = 'transectionCategoryFormModal' // Combined Add/Edit modal
}

@Component({
  selector: 'app-transection-category',
  templateUrl: './transection-category.component.html',
  styleUrls: ['./transection-category.component.css']
})
export class TransectionCategoryComponent extends BaseCrudComponent<TransectionCategory, TransectionCategoryReqDto> implements OnInit {
  entityName = 'TransectionCategory';
  entityNameLower = 'transectionCategory';
  isEditMode = false; // Track whether we're editing or adding

  columns: TableColumn<TransectionCategory>[] = [
    { key: 'id', label: 'SL', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'description', label: 'Description', visible: false },
    { key: 'type', label: 'Type', visible: true},
    { key: 'active', label: 'Active', visible: true }
  ];

  get transectionCategorys(): TransectionCategory[] {
    return this.items;
  }

  get selectedTransectionCategory(): TransectionCategory | null {
    return this.selectedItem;
  }

  set selectedTransectionCategory(value: TransectionCategory | null) {
    this.selectedItem = value;
  }

  get filteredTransectionCategorys(): TransectionCategory[] {
    return this.items;
  }

  // Computed property for modal title
  get modalTitle(): string {
    return this.isEditMode ? 'Edit Transaction Category' : 'Add New Transaction Category';
  }

  // Computed property for submit button text
  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Add Category';
  }

  constructor(
    public service: TransectionCategoryService,
    public pageHeaderService: PageHeaderService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Transection Type List');
    this.loadItems();
  }

  createNew(): TransectionCategory {
    return {
      id: 0,
      name: '',
      description: '',
      active: true,
      type: undefined,
      sqn: 0
    };
  }

  isValid(transectionCategory: TransectionCategory | null): boolean {
    if (!transectionCategory) return false;
    return !!(transectionCategory.name && transectionCategory.sqn && transectionCategory.type);
  }

  mapToDto(transectionCategory: TransectionCategory): TransectionCategoryReqDto {
    return {
      name: transectionCategory.name,
      description: transectionCategory.description,
      type: transectionCategory.type,
      sqn: transectionCategory.sqn,
    };
  }

  // Open modal for adding new category
  openAddModal(): void {
    this.isEditMode = false;
    this.selectedTransectionCategory = this.createNew();
  }

  // Open modal for editing existing category
  editTransectionCategory(transectionCategory: TransectionCategory): void {
    this.isEditMode = true;
    this.editItem(transectionCategory);
  }

  viewTransectionCategory(transectionCategory: TransectionCategory): void {
    this.viewItem(transectionCategory);
  }

  // Single save method that handles both add and edit
  saveTransectionCategory(): void {
    if (!this.isValid(this.selectedTransectionCategory)) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const dto = this.mapToDto(this.selectedTransectionCategory!);
    this.isLoading = true;

    const operation = this.isEditMode && this.selectedTransectionCategory?.id
      ? this.service.update(this.selectedTransectionCategory.id, dto)
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
              ? 'Transaction Category updated successfully'
              : 'Transaction Category added successfully';
            this.handleCrudSuccess(message, ModalType.FORM);
          }
        },
        error: (error) => {
          const message = this.isEditMode
            ? 'Failed to update transaction category'
            : 'Failed to add transaction category';
          this.handleError(message, error);
        }
      });
  }

  deleteTransectionCategory(transectionCategory: TransectionCategory): void {
    this.deleteItem(transectionCategory, transectionCategory.name);
  }

  loadTransectionCategorys(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  openDeleteModal(transectionCategory: TransectionCategory) {
    this.selectedTransectionCategory = transectionCategory;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('confirmDeleteModal')
    );
    modal.show();
  }

  confirmDelete() {
    if (this.selectedTransectionCategory) {
      this.deleteItem(this.selectedTransectionCategory, this.selectedTransectionCategory.name);
    }
  }
}