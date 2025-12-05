import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Sales, SalesReqDto, SalesService, SalesItem } from 'src/app/core/services/sales/sales.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Customer, CustomerService } from 'src/app/core/services/customer/customer.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { IncomeService } from 'src/app/core/services/income/income.service';

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
  paymentMethod: PaymentMethod[] = [];
  roleId = 0;
  userId = 0;
  submitted = false;

  isSearchingCustomer = false;
  customerFound = false;

  selectedSale: Sales | null = null;

  formData = {
    customerName: '',
    phone: '',
    email: '',
    address: '',
    companyName: '',
    sellDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
    items: [] as SalesItem[],
    subTotal: 0,
    vat: 0,
    discount: 0,
    totalPrice: 0,
    paidAmount: 0,
    paymentMethodId: 0,
    trackingId: '',
    dueAmount: 0,
    status: 'PENDING'
  };

  currentItem: SalesItem = {
    itemName: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0
  };

  columns: TableColumn<Sales>[] = [
    { key: 'invoiceNo', label: 'Invoice No', visible: true },
    { key: 'customerName', label: 'Customer Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'sellDate', label: 'Date', visible: true },
    { key: 'totalAmount', label: 'Total Amount', visible: true },
    { key: 'paidAmount', label: 'Paid Amount', visible: false },
    { key: 'dueAmount', label: 'Due Amount', visible: true },
    { key: 'status', label: 'Status', visible: true }
  ];

  get sales(): Sales[] {
    return this.items;
  }

  get filteredSales(): Sales[] {
    return this.items;
  }

  constructor(
    public service: SalesService,
    public incomeService: IncomeService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService,
    private customerService: CustomerService,
    public paymentMethodService: PaymentMethodService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Sales List');
    this.loadItems();
    this.loadPaymentMethods();
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
      deliveryDate: '',
      notes: '',
      subTotal: 0,
      vat: 0,
      discount: 0,
      totalAmount: 0,
      paidAmount: 0,
      paymentMethodId: 0,
      trackingId: '',
      dueAmount: 0,
      status: 'PENDING',
      items: [],
      payments: []
    };
  }

  mapToDto(sale: Sales): SalesReqDto {
    return {
      customerName: this.formData.customerName.trim(),
      phone: this.formData.phone.trim(),
      email: this.formData.email?.trim() || '',
      address: this.formData.address?.trim() || '',
      companyName: this.formData.companyName?.trim() || '',
      sellDate: this.formData.sellDate,
      deliveryDate: this.formData.deliveryDate?.trim() || '',
      notes: this.formData.notes?.trim() || '',
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      paidAmount: this.formData.paidAmount,
      paymentMethodId: this.formData.paymentMethodId,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items
    };
  }

  openAddModal(): void {
    this.resetFormData();
    this.isEditMode = false;
    this.validationErrors = {};
    this.errorMessage = '';
    this.customerFound = false;
    this.submitted = false;
  }

  viewSale(sale: Sales): void {
    this.selectedSale = sale;
  }

  editSale(sale: Sales): void {
    this.selectedSale = sale;
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    this.customerFound = false;
    this.submitted = false;

    // Populate form data from selected sale
    this.formData = {
      customerName: sale.customerName,
      phone: sale.phone,
      email: sale.email || '',
      address: sale.address || '',
      companyName: sale.companyName || '',
      sellDate: sale.sellDate,
      deliveryDate: sale.deliveryDate || '',
      notes: sale.notes || '',
      items: [...sale.items],
      subTotal: sale.subTotal,
      vat: sale.vat,
      discount: sale.discount,
      totalPrice: sale.totalAmount,
      paidAmount: sale.paidAmount,
      paymentMethodId: sale.paymentMethodId,
      trackingId: sale.trackingId || '',
      dueAmount: sale.dueAmount,
      status: sale.status
    };
  }

  // ==================== Customer Search ====================

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const phone = input.value;
    this.formData.phone = phone;
    this.customerFound = false;
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const phone = this.formData.phone.trim();

      if (phone && phone.length >= 3) {
        this.searchCustomerByPhone(phone);
      } else {
        this.errorMessage = 'Please enter at least 3 characters';
        setTimeout(() => this.clearError(), 3000);
      }
    }
  }

  searchCustomerByPhone(phone: string): void {
    this.isSearchingCustomer = true;
    this.validationErrors['phone'] = [];

    this.customerService.getByPhone(phone)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSearchingCustomer = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            // Customer found
            this.populateCustomerData(response.data);
            this.customerFound = true;
            this.validationErrors['phone'] = [];
          } else {
            // Customer not found (success=false)
            this.clearCustomerFields();
            this.customerFound = false;
            this.validationErrors['phone'] = [response.message || 'Customer not found'];
          }
        },
        error: (err: any) => {
          this.clearCustomerFields();
          this.customerFound = false;
          this.validationErrors['phone'] = [err?.error?.message || 'Customer not found'];
        }
      });
  }

  populateCustomerData(customer: Customer): void {
    this.formData.customerName = customer.name || '';
    this.formData.email = customer.email || '';
    this.formData.address = customer.address || '';
    this.formData.companyName = customer.companyName || '';
  }

  clearCustomerFields(): void {
    this.formData.customerName = '';
    this.formData.email = '';
    this.formData.address = '';
    this.formData.companyName = '';
  }

  // ==================== Save Methods ====================

  saveSaleForm(): void {
    this.submitted = true;
    this.calculateTotals();

    if (this.isEditMode) {
      this.updateSale();
    } else {
      this.createSale();
    }
  }

  createSale(): void {
    const sale: Sales = {
      id: 0,
      invoiceNo: '',
      customerName: this.formData.customerName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      sellDate: this.formData.sellDate,
      deliveryDate: this.formData.deliveryDate,
      notes: this.formData.notes,
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      paidAmount: this.formData.paidAmount,
      paymentMethodId: this.formData.paymentMethodId,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items,
      trackingId: this.formData.trackingId
    };

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
          console.log('Success response:', response);

          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else if (response.success) {
            this.handleCrudSuccess('Sale created successfully', ModalType.FORM);
            this.validationErrors = {};
            this.resetFormData();
            this.submitted = false;
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
            this.handleError('Failed to create sale', error);
          }
        }
      });
  }

  updateSale(): void {
    if (!this.selectedSale?.id) {
      this.errorMessage = 'Invalid sale data';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const sale: Sales = {
      id: this.selectedSale.id,
      invoiceNo: this.selectedSale.invoiceNo,
      customerName: this.formData.customerName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      sellDate: this.formData.sellDate,
      deliveryDate: this.formData.deliveryDate,
      notes: this.formData.notes,
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      paidAmount: this.formData.paidAmount,
      paymentMethodId: this.formData.paymentMethodId,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items,
      trackingId: this.formData.trackingId
    };

    const dto = this.mapToDto(sale);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedSale.id, dto)
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
            this.handleCrudSuccess('Sale updated successfully', ModalType.FORM);
            this.validationErrors = {};
            this.submitted = false;
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
    this.currentItem.totalPrice = this.currentItem.quantity * this.currentItem.unitPrice;
  }

  addItemToList(): void {
    if (!this.currentItem.itemName.trim()) {
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
      itemName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
  }

  calculateTotals(): void {
    this.formData.subTotal = this.formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = (this.formData.subTotal * this.formData.vat) / 100;
    this.formData.totalPrice = this.formData.subTotal + vatAmount - this.formData.discount;
    this.formData.dueAmount = this.formData.totalPrice - this.formData.paidAmount;

    if (this.formData.dueAmount < 0) {
      this.formData.dueAmount = 0;
    }
  }

  resetFormData(): void {
    const today = new Date().toISOString().split('T')[0];
    this.formData = {
      customerName: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      sellDate: today,
      deliveryDate: '',
      notes: '',
      items: [],
      subTotal: 0,
      vat: 0,
      discount: 0,
      totalPrice: 0,
      paidAmount: 0,
      paymentMethodId: 0,
      trackingId: '',
      dueAmount: 0,
      status: 'DELIVERED'
    };
    this.resetCurrentItem();
    this.customerFound = false;
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllActive(true).subscribe({
      next: (res) => {
        this.paymentMethod = res.data.map(method => ({
          ...method,
          id: Number(method.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load payment methods', err);
      }
    });
  }

  updatePaymentData = {
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  paymentMethodId: 0,
  trackingId: '',
  description: ''
};

// Method to open the update modal
openUpdateModal(sale: Sales): void {
  this.selectedSale = sale;
  this.validationErrors = {};
  this.errorMessage = '';

  // Reset payment form
  this.updatePaymentData = {
    amount: sale.dueAmount > 0 ? sale.dueAmount : 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethodId: 0,
    trackingId: '',
    description: ''
  };

  // Open modal
  const modal = new (window as any).bootstrap.Modal(
    document.getElementById('updateSaleModal')
  );
  modal.show();
}

// Calculate remaining due after adding new payment
calculateRemainingDue(): number {
  if (!this.selectedSale) return 0;
  const remainingDue = this.selectedSale.dueAmount - (this.updatePaymentData.amount || 0);
  return remainingDue < 0 ? 0 : remainingDue;
}

// Add payment to sale
addPaymentToSale(): void {
  if (!this.selectedSale) return;

  // Validation
  if (!this.updatePaymentData.amount || this.updatePaymentData.amount <= 0) {
    this.validationErrors['amount'] = ['Payment amount is required and must be greater than 0'];
    return;
  }

  if (this.updatePaymentData.amount > this.selectedSale.dueAmount) {
    this.validationErrors['amount'] = ['Payment amount cannot exceed due amount'];
    return;
  }

  if (!this.updatePaymentData.date) {
    this.validationErrors['date'] = ['Payment date is required'];
    return;
  }

  if (!this.updatePaymentData.paymentMethodId || this.updatePaymentData.paymentMethodId === 0) {
    this.validationErrors['paymentMethodId'] = ['Payment method is required'];
    return;
  }

  // Create payment DTO
  const paymentDto = {
    saleId: this.selectedSale.id,
    amount: this.updatePaymentData.amount,
    incomeDate: this.updatePaymentData.date,
    paymentMethodId: this.updatePaymentData.paymentMethodId,
    trackingId: this.updatePaymentData.trackingId || '',
    description: this.updatePaymentData.description || `Payment for Invoice ${this.selectedSale.invoiceNo}`
  };

  this.isLoading = true;
  this.validationErrors = {};
  this.errorMessage = '';

  // Call your service method to add payment
  // Assuming you have a method like addPayment in your SalesService
  this.incomeService.addPayment(paymentDto)
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
          this.handleCrudSuccess('Payment added successfully', 'updateSaleModal');
          this.loadItems(); // Reload the sales list
          this.validationErrors = {};
        }
      },
      error: (error: any) => {
        if (error.status === 400 && error.error && error.error.errors) {
          this.validationErrors = error.error.errors;
          this.errorMessage = error.error.message || 'Validation Failed';
        } else {
          this.handleError('Failed to add payment', error);
        }
      }
    });
}
  // ==================== Utility Methods ====================

  printSaleMemo(): void {
    if (this.selectedSale) {
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