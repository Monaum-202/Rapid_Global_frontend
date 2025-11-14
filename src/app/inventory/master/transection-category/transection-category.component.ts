import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { TransectionCategory, TransectionCategoryReqDto, TransectionCategoryService } from 'src/app/core/services/transectionCategory/transection-category.service';

enum ModalType {
  VIEW = 'transectionCategoryModal',
  ADD = 'transectionCategoryAddModal',
  EDIT = 'transectionCategoryEditModal'
}

@Component({
  selector: 'app-transection-category',
  templateUrl: './transection-category.component.html',
  styleUrls: ['./transection-category.component.css']
})
export class TransectionCategoryComponent extends BaseCrudComponent<TransectionCategory, TransectionCategoryReqDto> implements OnInit {
  entityName = 'TransectionCategory';
  entityNameLower = 'transectionCategory';

  columns: TableColumn<TransectionCategory>[] = [
    { key: 'id', label: 'SL', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'description', label: 'Description', visible: true },
    { key: 'type', label: 'Type', visible: true},
    { key: 'active', label: 'Active', visible: true }
  ];

  // Expose items with proper naming for template
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

  constructor(
    public service: TransectionCategoryService,
    public pageHeaderService: PageHeaderService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Payment Method List');
    this.loadItems();
  }

  // ==================== Component-Specific Methods ====================

  createNew(): TransectionCategory {
    return {
      id: 0,
      name: '',
      description: '',
      active: true,
      type:undefined,
      sqn: 0
    };
  }

  isValid(transectionCategory: TransectionCategory | null): boolean {
    if (!transectionCategory) return false;
    return !!(transectionCategory.name && transectionCategory.description && transectionCategory.sqn && transectionCategory.type);
  }

  mapToDto(transectionCategory: TransectionCategory): TransectionCategoryReqDto {
    return {
      name: transectionCategory.name,
      description: transectionCategory.description,
      type: transectionCategory.type,
      sqn: transectionCategory.sqn,
    };
  }

  // ==================== Template-Friendly Method Names ====================

  openAddModal(): void {
    this.selectedTransectionCategory = this.createNew();
  }

  viewTransectionCategory(transectionCategory: TransectionCategory): void {
    this.viewItem(transectionCategory);
  }

  editTransectionCategory(transectionCategory: TransectionCategory): void {
    this.editItem(transectionCategory);
  }

  addTransectionCategory(): void {
    if (!this.isValid(this.selectedTransectionCategory)) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const dto = this.mapToDto(this.selectedTransectionCategory!);

    this.isLoading = true;
    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleCrudSuccess('TransectionCategory added successfully', ModalType.ADD);
          }
        },
        error: (error) => this.handleError('Failed to add transectionCategory', error)
      });
  }

  saveTransectionCategory(): void {
    if (!this.isValid(this.selectedTransectionCategory) || !this.selectedTransectionCategory?.id) {
      this.errorMessage = 'Invalid transectionCategory data';
      return;
    }

    const dto = this.mapToDto(this.selectedTransectionCategory);

    this.isLoading = true;
    this.service.update(this.selectedTransectionCategory.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleCrudSuccess('TransectionCategory updated successfully', ModalType.EDIT);
          }
        },
        error: (error) => this.handleError('Failed to update transectionCategory', error)
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