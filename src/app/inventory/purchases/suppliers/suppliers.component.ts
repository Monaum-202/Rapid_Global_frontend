import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { simpleCrudComponent, TableColumn } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Supplier, SupplierReqDto, SupplierService } from 'src/app/core/services/supplier/supplier.service';

enum ModalType {
  VIEW = 'supplierModal',
  FORM = 'supplierFormModal',
  DELETE = 'confirmDeleteModal'
}

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css']
})
export class SuppliersComponent extends simpleCrudComponent<Supplier, SupplierReqDto> implements OnInit {
  entityName = 'Supplier';
  entityNameLower = 'supplier';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  submitted = false;

  columns: TableColumn<Supplier>[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'altPhone', label: 'Alt Phone', visible: false },
    { key: 'email', label: 'Email', visible: true },
    { key: 'address', label: 'Address', visible: false },
    { key: 'companyName', label: 'Business Address', visible: false },
    { key: 'totalTransaction', label: 'Total Transaction', visible: true }
  ];

  get suppliers(): Supplier[] {
    return this.items;
  }

  get selectedSupplier(): Supplier | null {
    return this.selectedItem;
  }

  set selectedSupplier(value: Supplier | null) {
    this.selectedItem = value;
  }

  get filteredSuppliers(): Supplier[] {
    return this.items;
  }

  constructor(
    public service: SupplierService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Supplier List');
    this.loadItems();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  createNew(): Supplier {
    return {
      id: 0,
      name: '',
      phone: '',
      altPhone: undefined,
      email: '',
      address: '',
      companyName: '',
      totalTransaction: 0
    };
  }

  mapToDto(supplier: Supplier): SupplierReqDto {
    const dto: any = {};

    if (supplier.name && supplier.name.trim() !== '') {
      dto.name = supplier.name.trim();
    }

    if (supplier.phone && supplier.phone.trim() !== '') {
      dto.phone = supplier.phone.trim();
    }

    if (supplier.altPhone) {
      dto.altPhone = supplier.altPhone;
    }

    if (supplier.email && supplier.email.trim() !== '') {
      dto.email = supplier.email.trim();
    }

    if (supplier.address && supplier.address.trim() !== '') {
      dto.address = supplier.address.trim();
    }

    if (supplier.companyName && supplier.companyName.trim() !== '') {
      dto.companyName = supplier.companyName.trim();
    }

    return dto;
  }

  openAddModal(): void {
    this.selectedSupplier = this.createNew();
    this.isEditMode = false;
    this.validationErrors = {};
    this.errorMessage = '';
    console.log('Opening add modal, validation errors cleared:', this.validationErrors);
  }

  viewSupplier(supplier: Supplier): void {
    this.viewItem(supplier);
  }

  editSupplier(supplier: Supplier): void {
    this.selectedSupplier = { ...supplier };
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    console.log('Opening edit modal, validation errors cleared:', this.validationErrors);
  }

  addSupplier(): void {
    const dto = this.mapToDto(this.selectedSupplier!);

    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Success response:', response);

          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else if (response.success) {
            this.handleCrudSuccess('Supplier added successfully', ModalType.FORM);
            this.validationErrors = {};
          }
        },
        error: (error: any) => {
          console.log('Error response:', error);
          console.log('Error body:', error.error);

          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else {
            this.handleError('Failed to add supplier', error);
          }
        }
      });
  }

  saveSupplierForm(): void {
    this.submitted = true;

    if (this.isEditMode) {
      this.saveSupplier();
    } else {
      this.addSupplier();
    }
  }

  saveSupplier(): void {
    if (!this.selectedSupplier?.id) {
      this.errorMessage = 'Invalid supplier data';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const dto = this.mapToDto(this.selectedSupplier);
    console.log('Updating DTO:', dto);

    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedSupplier.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Success response:', response);

          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else if (response.success) {
            this.handleCrudSuccess('Supplier updated successfully', ModalType.FORM);
            this.validationErrors = {};
          }
        },
        error: (error: any) => {
          console.log('Error response:', error);
          console.log('Error body:', error.error);

          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else {
            this.handleError('Failed to update supplier', error);
          }
        }
      });
  }

  openDeleteModal(supplier: Supplier): void {
    this.selectedSupplier = supplier;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedSupplier) {
      this.deleteItem(this.selectedSupplier, this.selectedSupplier.name);
    }
  }

  loadSuppliers(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }
}