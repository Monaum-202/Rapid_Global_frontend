import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Sales, SalesReqDto, SalesService, SalesItem } from 'src/app/core/services/sales/sales.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';

enum ModalType {
  VIEW = 'sellModal',
  FORM = 'expadd',
  DELETE = 'confirmDeleteModal'
}

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css']
})
export class SalesListComponent extends simpleCrudComponent<Sales, SalesReqDto> implements OnInit {
  entityName = 'Sale';
  entityNameLower = 'sale';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  submitted = false;

  // Form data
  formData = {
    customerName: '',
    phone: '',
    email: '',
    address: '',
    companyName: '',
    sellDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as SalesItem[],
    subtotal: 0,
    vat: 0,
    tax: 0,
    discount: 0,
    total: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: 'PENDING'
  };

  // Current item being added
  currentItem: SalesItem = {
    name: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  };

  columns: TableColumn<Sales>[] = [
    { key: 'invoiceNo', label: 'Invoice No', visible: true },
    { key: 'customerName', label: 'Customer Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'sellDate', label: 'Date', visible: true },
    { key: 'totalAmount', label: 'Total Amount', visible: true },
    { key: 'paidAmount', label: 'Paid Amount', visible: true },
    { key: 'dueAmount', label: 'Due Amount', visible: true },
    { key: 'status', label: 'Status', visible: true }
  ];

  get sales(): Sales[] {
    return this.items;
  }

  get selectedSale(): Sales | null {
    return this.selectedItem;
  }

  set selectedSale(value: Sales | null) {
    this.selectedItem = value;
  }

  get filteredSales(): Sales[] {
    return this.items;
  }

  constructor(
    public service: SalesService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Sales List');
    this.loadItems();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  createNew(): Sales {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 0,
      invoiceNo: '',
      customerName: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      sellDate: today,
      notes: '',
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'PENDING',
      items: []
    };
  }

  mapToDto(sale: Sales): SalesReqDto {
    return {
      customerName: sale.customerName.trim(),
      phone: sale.phone.trim(),
      email: sale.email?.trim(),
      address: sale.address?.trim(),
      companyName: sale.companyName?.trim(),
      sellDate: sale.sellDate,
      notes: sale.notes?.trim(),
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      status: sale.status,
      items: sale.items
    };
  }

  openAddModal(): void {
    this.resetFormData();
    this.isEditMode = false;
    this.validationErrors = {};
    this.errorMessage = '';
  }

  viewSale(sale: Sales): void {
    this.selectedSale = sale;
  }

  editSale(sale: Sales): void {
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    
    // Populate form data
    this.formData = {
      customerName: sale.customerName,
      phone: sale.phone,
      email: sale.email || '',
      address: sale.address || '',
      companyName: sale.companyName || '',
      sellDate: sale.sellDate,
      notes: sale.notes || '',
      items: [...sale.items],
      subtotal: 0,
      vat: 0,
      tax: 0,
      discount: 0,
      total: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      status: sale.status
    };
    
    this.selectedSale = sale;
    this.calculateTotals();
  }

  saveSaleForm(): void {
    this.submitted = true;

    // Validate required fields
    if (!this.validateForm()) {
      return;
    }

    // Calculate final amounts
    this.calculateTotals();

    // Prepare sale object
    const sale: Sales = {
      id: this.isEditMode ? this.selectedSale!.id : 0,
      invoiceNo: this.isEditMode ? this.selectedSale!.invoiceNo : '',
      customerName: this.formData.customerName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      sellDate: this.formData.sellDate,
      notes: this.formData.notes,
      totalAmount: this.formData.total,
      paidAmount: this.formData.paidAmount,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items
    };

    if (this.isEditMode) {
      this.updateSale(sale);
    } else {
      this.createSale(sale);
    }
  }

  createSale(sale: Sales): void {
    const dto = this.mapToDto(sale);
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
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
          } else if (response.success) {
            this.handleCrudSuccess('Sale created successfully', ModalType.FORM);
            this.validationErrors = {};
            this.resetFormData();
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
          } else {
            this.handleError('Failed to create sale', error);
          }
        }
      });
  }

  updateSale(sale: Sales): void {
    if (!sale.id) {
      this.errorMessage = 'Invalid sale data';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const dto = this.mapToDto(sale);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(sale.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
          } else if (response.success) {
            this.handleCrudSuccess('Sale updated successfully', ModalType.FORM);
            this.validationErrors = {};
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
          } else {
            this.handleError('Failed to update sale', error);
          }
        }
      });
  }

  openDeleteModal(sale: Sales): void {
    this.selectedSale = sale;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedSale) {
      this.deleteItem(this.selectedSale, this.selectedSale.invoiceNo);
    }
  }

  approvePayment(sale: Sales): void {
    if (sale.dueAmount <= 0) {
      this.errorMessage = 'No due amount to approve';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (confirm(`Are you sure you want to approve payment for ${sale.invoiceNo}?`)) {
      this.isLoading = true;
      this.service.approvePayment(sale.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadItems();
              this.closeModal(ModalType.VIEW);
            } else {
              this.errorMessage = response.message || 'Failed to approve payment';
              setTimeout(() => this.clearError(), 3000);
            }
          },
          error: (error: any) => this.handleError('Failed to approve payment', error)
        });
    }
  }

  // ==================== Item Management ====================

  calculateItemTotal(): void {
    this.currentItem.total = this.currentItem.quantity * this.currentItem.unitPrice;
  }

  addItemToList(): void {
    if (!this.currentItem.name.trim()) {
      this.errorMessage = 'Item name is required';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (this.currentItem.quantity <= 0 || this.currentItem.unitPrice <= 0) {
      this.errorMessage = 'Quantity and unit price must be greater than 0';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    this.formData.items.push({ ...this.currentItem });
    this.resetCurrentItem();
    this.calculateTotals();
  }

  removeItem(index: number): void {
    this.formData.items.splice(index, 1);
    this.calculateTotals();
  }

  resetCurrentItem(): void {
    this.currentItem = {
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
  }

  calculateTotals(): void {
    // Calculate subtotal from items
    this.formData.subtotal = this.formData.items.reduce((sum, item) => sum + item.total, 0);

    // Calculate VAT and Tax
    const vatAmount = (this.formData.subtotal * this.formData.vat) / 100;
    const taxAmount = (this.formData.subtotal * this.formData.tax) / 100;

    // Calculate total
    this.formData.total = this.formData.subtotal + vatAmount + taxAmount - this.formData.discount;

    // Calculate due amount
    this.formData.dueAmount = this.formData.total - this.formData.paidAmount;

    // Ensure non-negative values
    if (this.formData.dueAmount < 0) {
      this.formData.dueAmount = 0;
    }
  }

  validateForm(): boolean {
    if (!this.formData.customerName.trim()) {
      this.errorMessage = 'Customer name is required';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    if (!this.formData.phone.trim()) {
      this.errorMessage = 'Phone number is required';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    if (!this.formData.sellDate) {
      this.errorMessage = 'Sale date is required';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    if (this.formData.items.length === 0) {
      this.errorMessage = 'At least one item is required';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    return true;
  }

  resetFormData(): void {
    this.formData = {
      customerName: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      sellDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [],
      subtotal: 0,
      vat: 0,
      tax: 0,
      discount: 0,
      total: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'PENDING'
    };
    this.resetCurrentItem();
  }

  // ==================== Utility Methods ====================

  printSaleMemo(): void {
    if (this.selectedSale) {
      // Implement PDF generation logic here
      console.log('Printing sale memo for:', this.selectedSale.invoiceNo);
    }
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }
}