import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Customer, CustomerReqDto, CustomerService } from 'src/app/core/services/customer/customer.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';

enum ModalType {
  VIEW = 'customerModal',
  FORM = 'customerFormModal',
  DELETE = 'confirmDeleteModal'
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent extends simpleCrudComponent<Customer, CustomerReqDto> implements OnInit {
  entityName = 'Customer';
  entityNameLower = 'customer';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  submitted = false;

  columns: TableColumn<Customer>[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'altPhone', label: 'Alt Phone', visible: false },
    { key: 'email', label: 'Email', visible: true },
    { key: 'address', label: 'Address', visible: false },
    { key: 'businessAddress', label: 'Business Address', visible: false },
    { key: 'totalTransaction', label: 'Total Transaction', visible: true }
  ];

  get customers(): Customer[] {
    return this.items;
  }

  get selectedCustomer(): Customer | null {
    return this.selectedItem;
  }

  set selectedCustomer(value: Customer | null) {
    this.selectedItem = value;
  }

  get filteredCustomers(): Customer[] {
    return this.items;
  }

  constructor(
    public service: CustomerService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Customer List');
    this.loadItems();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  createNew(): Customer {
    return {
      id: 0,
      name: '',
      phone: '',
      altPhone: undefined,
      email: '',
      address: '',
      businessAddress: '',
      totalTransaction: 0,
      active: true
    };
  }

  mapToDto(customer: Customer): CustomerReqDto {
    const dto: any = {};

    if (customer.name && customer.name.trim() !== '') {
      dto.name = customer.name.trim();
    }

    if (customer.phone && customer.phone.trim() !== '') {
      dto.phone = customer.phone.trim();
    }

    if (customer.altPhone) {
      dto.altPhone = customer.altPhone;
    }

    if (customer.email && customer.email.trim() !== '') {
      dto.email = customer.email.trim();
    }

    if (customer.address && customer.address.trim() !== '') {
      dto.address = customer.address.trim();
    }

    if (customer.businessAddress && customer.businessAddress.trim() !== '') {
      dto.businessAddress = customer.businessAddress.trim();
    }

    return dto;
  }

  openAddModal(): void {
    this.selectedCustomer = this.createNew();
    this.isEditMode = false;
    this.validationErrors = {};
    this.errorMessage = '';
    console.log('Opening add modal, validation errors cleared:', this.validationErrors);
  }

  viewCustomer(customer: Customer): void {
    this.viewItem(customer);
  }

  editCustomer(customer: Customer): void {
    this.selectedCustomer = { ...customer };
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    console.log('Opening edit modal, validation errors cleared:', this.validationErrors);
  }

  addCustomer(): void {
    const dto = this.mapToDto(this.selectedCustomer!);

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
            this.handleCrudSuccess('Customer added successfully', ModalType.FORM);
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
            this.handleError('Failed to add customer', error);
          }
        }
      });
  }

  saveCustomerForm(): void {
    this.submitted = true;

    if (this.isEditMode) {
      this.saveCustomer();
    } else {
      this.addCustomer();
    }
  }

  saveCustomer(): void {
    if (!this.selectedCustomer?.id) {
      this.errorMessage = 'Invalid customer data';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const dto = this.mapToDto(this.selectedCustomer);
    console.log('Updating DTO:', dto);

    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedCustomer.id, dto)
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
            this.handleCrudSuccess('Customer updated successfully', ModalType.FORM);
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
            this.handleError('Failed to update customer', error);
          }
        }
      });
  }

  openDeleteModal(customer: Customer): void {
    this.selectedCustomer = customer;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedCustomer) {
      this.deleteItem(this.selectedCustomer, this.selectedCustomer.name);
    }
  }

  loadCustomers(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }
}