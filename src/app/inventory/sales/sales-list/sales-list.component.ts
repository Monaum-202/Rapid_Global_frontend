import { Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, takeUntil, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Sales, SalesReqDto, SalesService, SalesItem } from 'src/app/core/services/sales/sales.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Customer, CustomerService } from 'src/app/core/services/customer/customer.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { IncomeService } from 'src/app/core/services/income/income.service';
import { Product, ProductService } from 'src/app/core/services/product/product.service';

enum ModalType {
  VIEW = 'sellModal',
  FORM = 'expadd',
  DELETE = 'confirmDeleteModal',
  CANCEL = 'cancelReasonModal',
  UPDATE = 'updateSaleModal'
}

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css']
})
export class SalesListComponent extends simpleCrudComponent<Sales, SalesReqDto> implements OnInit, OnDestroy {
  entityName = 'Sale';
  entityNameLower = 'sale';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  paymentMethod: PaymentMethod[] = [];
  roleId = 0;
  userId = 0;
  submitted = false;
  editIndex: number | null = null;
  isSearchingCustomer = false;
  customerFound = false;

  // Product search related
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isSearchingProduct = false;
  showProductDropdown = false;
  productSearchSubject = new Subject<string>();
  private productSearchSubscription?: any;

  selectedSale: Sales | null = null;
  private modalInstances: Map<string, any> = new Map();

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
    payments: [] as any[],
    subTotal: 0,
    vat: 0,
    discount: 0,
    totalPrice: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: 'PENDING'
  };

  currentItem: SalesItem = {
    itemName: '',
    unitName: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0
  };

  currentPayment = {
    amount: 0,
    paymentMethodId: 0,
    trackingId: ''
  };

  paymentEditIndex: number | null = null;

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

  updatePaymentData = {
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethodId: 0,
    trackingId: '',
    description: ''
  };

  constructor(
    public service: SalesService,
    public incomeService: IncomeService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService,
    private customerService: CustomerService,
    public paymentMethodService: PaymentMethodService,
    private productService: ProductService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Sales List');
    this.loadItems();
    this.loadPaymentMethods();
    this.loadProducts();
    this.setupProductSearch();

    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.productSearchSubscription) {
      this.productSearchSubscription.unsubscribe();
    }
    this.productSearchSubject.complete();
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
      status: '',
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
      deliveryDate: this.formData.deliveryDate || null,
      notes: this.formData.notes?.trim() || '',
      discount: this.formData.discount,
      vat: this.formData.vat,
      paymentMethodId: 0,
      status: this.formData.status,
      items: this.formData.items,
      payments: this.formData.payments.map(p => ({
        amount: p.amount,
        paymentMethodId: p.paymentMethodId,
        incomeDate: this.formData.sellDate,
        description: `Payment for Invoice`,
        paidFrom: this.formData.customerName,
        paidFromCompany: this.formData.companyName || '',
        incomeCategory: null,
        trackingId: p.trackingId || ''
      }))
    };
  }

  // ============================================
  // IMPROVED VALIDATION METHODS
  // ============================================

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Phone validation
    if (!this.formData.phone || this.formData.phone.trim().length < 11) {
      this.validationErrors['phone'] = ['Phone number must be at least 11 digits'];
      isValid = false;
    }

    // Customer name validation
    if (!this.formData.customerName || this.formData.customerName.trim().length < 2) {
      this.validationErrors['customerName'] = ['Customer name is required (min 2 characters)'];
      isValid = false;
    }

    // Email validation (if provided)
    if (this.formData.email && this.formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.formData.email)) {
        this.validationErrors['email'] = ['Please enter a valid email address'];
        isValid = false;
      }
    }

    // Date validation
    if (!this.formData.sellDate) {
      this.validationErrors['sellDate'] = ['Sale date is required'];
      isValid = false;
    }

    // Delivery date validation (must be after sell date if provided)
    if (this.formData.deliveryDate && this.formData.sellDate) {
      const sellDate = new Date(this.formData.sellDate);
      const deliveryDate = new Date(this.formData.deliveryDate);
      if (deliveryDate < sellDate) {
        this.validationErrors['deliveryDate'] = ['Delivery date must be after sale date'];
        isValid = false;
      }
    }

    // Items validation
    if (!this.formData.items || this.formData.items.length === 0) {
      this.validationErrors['items'] = ['At least one item is required'];
      isValid = false;
    }

    // Validate each item
    this.formData.items.forEach((item, index) => {
      if (!item.itemName || item.itemName.trim() === '') {
        this.validationErrors[`item_${index}_name`] = ['Item name is required'];
        isValid = false;
      }
      if (item.quantity <= 0) {
        this.validationErrors[`item_${index}_quantity`] = ['Quantity must be greater than 0'];
        isValid = false;
      }
      if (item.unitPrice < 0) {
        this.validationErrors[`item_${index}_price`] = ['Unit price cannot be negative'];
        isValid = false;
      }
    });

    // Payment validation (only in add mode)
    if (!this.isEditMode) {
      const totalPayments = this.formData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (totalPayments > this.formData.totalPrice) {
        this.validationErrors['payment'] = ['Total payments cannot exceed total amount'];
        isValid = false;
      }

      // Validate each payment
      this.formData.payments.forEach((payment, index) => {
        if (payment.amount <= 0) {
          this.validationErrors[`payment_${index}_amount`] = ['Payment amount must be greater than 0'];
          isValid = false;
        }
        if (!payment.paymentMethodId || payment.paymentMethodId === 0) {
          this.validationErrors[`payment_${index}_method`] = ['Payment method is required'];
          isValid = false;
        }
      });
    }

    return isValid;
  }

  validateCurrentItem(): boolean {
    if (!this.currentItem.itemName || this.currentItem.itemName.trim() === '') {
      this.errorMessage = 'Item name is required';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    if (this.currentItem.quantity <= 0) {
      this.errorMessage = 'Quantity must be greater than 0';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    if (this.currentItem.unitPrice < 0) {
      this.errorMessage = 'Unit price cannot be negative';
      setTimeout(() => this.clearError(), 3000);
      return false;
    }

    return true;
  }

  validateCurrentPayment(): boolean {
    this.validationErrors['payment'] = [];

    if (!this.currentPayment.amount || this.currentPayment.amount <= 0) {
      this.validationErrors['payment'] = ['Payment amount must be greater than 0'];
      return false;
    }

    if (!this.currentPayment.paymentMethodId || this.currentPayment.paymentMethodId === 0) {
      this.validationErrors['payment'] = ['Payment method is required'];
      return false;
    }

    const totalPayments = this.formData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const newTotal = this.paymentEditIndex !== null
      ? totalPayments - this.formData.payments[this.paymentEditIndex].amount + this.currentPayment.amount
      : totalPayments + this.currentPayment.amount;

    if (newTotal > this.formData.totalPrice) {
      this.validationErrors['payment'] = [`Total payments (${newTotal.toFixed(2)}) cannot exceed total amount (${this.formData.totalPrice.toFixed(2)})`];
      return false;
    }

    return true;
  }

  // ============================================
  // MODAL MANAGEMENT
  // ============================================

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
    this.customerFound = true; // Already has customer data
    this.submitted = false;

    this.formData = {
      customerName: sale.customerName,
      phone: sale.phone,
      email: sale.email || '',
      address: sale.address || '',
      companyName: sale.companyName || '',
      sellDate: sale.sellDate,
      deliveryDate: sale.deliveryDate || '',
      notes: sale.notes || '',
      items: JSON.parse(JSON.stringify(sale.items)), // Deep copy
      payments: [],
      subTotal: sale.subTotal,
      vat: sale.vat,
      discount: sale.discount,
      totalPrice: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      status: sale.status
    };
  }

  // ============================================
  // CUSTOMER SEARCH (OPTIMIZED)
  // ============================================

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const phone = input.value;
    this.formData.phone = phone;
    this.customerFound = false;

    // Clear customer data if phone is cleared
    if (!phone || phone.length < 3) {
      this.clearCustomerFields();
    }
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const phone = this.formData.phone.trim();

      if (phone && phone.length >= 11) {
        this.searchCustomerByPhone(phone);
      } else {
        this.validationErrors['phone'] = ['Phone number must be at least 11 digits'];
      }
    }
  }

  searchCustomerByPhone(phone: string): void {
    if (this.isSearchingCustomer) return; // Prevent multiple searches

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
            this.populateCustomerData(response.data);
            this.customerFound = true;
            this.validationErrors['phone'] = [];
          } else {
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
    if (!this.customerFound) {
      this.formData.customerName = '';
      this.formData.email = '';
      this.formData.address = '';
      this.formData.companyName = '';
    }
  }

  // ============================================
  // ITEM MANAGEMENT (IMPROVED)
  // ============================================

  calculateItemTotal(): void {
    const quantity = Number(this.currentItem.quantity) || 0;
    const unitPrice = Number(this.currentItem.unitPrice) || 0;
    this.currentItem.totalPrice = quantity * unitPrice;
  }

  addItemToList(): void {
    if (!this.validateCurrentItem()) return;

    const newItem = {
      itemName: this.currentItem.itemName.trim(),
      unitName: this.currentItem.unitName.trim(),
      quantity: Number(this.currentItem.quantity),
      unitPrice: Number(this.currentItem.unitPrice),
      totalPrice: Number(this.currentItem.totalPrice)
    };

    if (this.editIndex !== null) {
      this.formData.items[this.editIndex] = newItem;
      this.editIndex = null;
    } else {
      this.formData.items.push(newItem);
    }

    this.resetCurrentItem();
    this.updateSubTotal();
    delete this.validationErrors['items'];
  }

  editSalesItem(index: number): void {
    this.editIndex = index;
    const item = this.formData.items[index];
    this.currentItem = {
      itemName: item.itemName,
      unitName: item.unitName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    };
  }

  removeItem(index: number): void {
    if (confirm('Are you sure you want to remove this item?')) {
      this.formData.items.splice(index, 1);
      this.updateSubTotal();

      if (this.formData.items.length === 0) {
        this.validationErrors['items'] = ['At least one item is required'];
      }
    }
  }

  resetCurrentItem(): void {
    this.currentItem = { itemName: '', unitName: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
    this.editIndex = null;
  }

  updateSubTotal(): void {
    this.formData.subTotal = this.formData.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    this.calculateTotals();
  }

  // ============================================
  // PAYMENT MANAGEMENT (IMPROVED)
  // ============================================

  addPaymentToList(): void {
    if (!this.validateCurrentPayment()) return;

    const newPayment = {
      amount: Number(this.currentPayment.amount),
      paymentMethodId: Number(this.currentPayment.paymentMethodId),
      trackingId: this.currentPayment.trackingId.trim()
    };

    if (this.paymentEditIndex !== null) {
      this.formData.payments[this.paymentEditIndex] = newPayment;
      this.paymentEditIndex = null;
    } else {
      this.formData.payments.push(newPayment);
    }

    this.resetCurrentPayment();
    this.calculateTotals();
    delete this.validationErrors['payment'];
  }

  editPayment(index: number): void {
    this.paymentEditIndex = index;
    const payment = this.formData.payments[index];
    this.currentPayment = {
      amount: payment.amount,
      paymentMethodId: payment.paymentMethodId,
      trackingId: payment.trackingId || ''
    };
  }

  removePayment(index: number): void {
    if (confirm('Are you sure you want to remove this payment?')) {
      this.formData.payments.splice(index, 1);
      this.calculateTotals();
    }
  }

  resetCurrentPayment(): void {
    this.currentPayment = {
      amount: 0,
      paymentMethodId: 0,
      trackingId: ''
    };
    this.paymentEditIndex = null;
  }

  getPaymentMethodName(id: number): string {
    const method = this.paymentMethod.find(m => m.id === id);
    return method ? method.name : 'Unknown';
  }

  // ============================================
  // CALCULATIONS (OPTIMIZED)
  // ============================================

  calculateTotals(): void {
    // Calculate subtotal
    this.formData.subTotal = this.formData.items.reduce((sum, item) =>
      sum + (Number(item.totalPrice) || 0), 0
    );

    // Calculate VAT
    const vatAmount = (this.formData.subTotal * Number(this.formData.vat)) / 100;

    // Calculate total
    this.formData.totalPrice = this.formData.subTotal + vatAmount - Number(this.formData.discount);

    // Ensure non-negative
    if (this.formData.totalPrice < 0) {
      this.formData.totalPrice = 0;
    }

    // Calculate paid amount
    this.formData.paidAmount = this.formData.payments.reduce((sum, payment) =>
      sum + (Number(payment.amount) || 0), 0
    );

    // Calculate due
    this.formData.dueAmount = this.formData.totalPrice - this.formData.paidAmount;
    if (this.formData.dueAmount < 0) {
      this.formData.dueAmount = 0;
    }
  }

  calculateRemainingDue(): number {
    if (!this.selectedSale) return 0;
    const remainingDue = this.selectedSale.dueAmount - (Number(this.updatePaymentData.amount) || 0);
    return remainingDue < 0 ? 0 : remainingDue;
  }

  // ============================================
  // PRODUCT SEARCH (OPTIMIZED)
  // ============================================

  setupProductSearch(): void {
    this.productSearchSubscription = this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterProducts(searchTerm);
    });
  }

  onProductSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value;
    this.currentItem.itemName = searchTerm;
    this.showProductDropdown = true;
    this.productSearchSubject.next(searchTerm);
  }

  filterProducts(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredProducts = this.products.slice(0, 10); // Show first 10
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredProducts = this.products
      .filter(product => product.name.toLowerCase().includes(search))
      .slice(0, 10); // Limit to 10 results
  }

  selectProduct(product: Product): void {
    this.currentItem.itemName = product.name;
    this.currentItem.unitName = product.unitName || '';
    this.currentItem.unitPrice = product.pricePerUnit || 0;
    this.calculateItemTotal();
    this.showProductDropdown = false;
  }

  hideProductDropdown(): void {
    setTimeout(() => {
      this.showProductDropdown = false;
    }, 200);
  }

  // ============================================
  // SAVE/UPDATE OPERATIONS (IMPROVED)
  // ============================================

  saveSaleForm(): void {
    this.submitted = true;

    // Validate form
    if (!this.validateForm()) {
      this.errorMessage = 'Please fix all validation errors before submitting';
      setTimeout(() => this.clearError(), 5000);
      return;
    }

    this.calculateTotals();

    if (this.isEditMode) {
      this.updateSale();
    } else {
      this.createSale();
    }
  }

  createSale(): void {
  if (this.isLoading) return;

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
    paymentMethodId: 0,
    dueAmount: this.formData.dueAmount,
    status: this.formData.status,
    items: this.formData.items,
    trackingId: ''
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
        if (response.success === false && response.errors) {
          this.validationErrors = response.errors;
          this.errorMessage = response.message || 'Validation Failed';
        } else if (response.success) {
          const createdSale: Sales = response.data;

          this.handleCrudSuccess('Sale created successfully', ModalType.FORM);
          this.resetFormData();
          this.submitted = false;

          // 🎯 AUTO ACTIONS: Print & Email
          this.handlePostSaleActions(createdSale);
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

  updateSale(): void {
    if (!this.selectedSale?.id || this.isLoading) return;

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
      paymentMethodId: 0,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items,
      trackingId: ''
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
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
          } else if (response.success) {
            this.handleCrudSuccess('Sale updated successfully', ModalType.FORM);
            this.submitted = false;
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

  // ============================================
  // UPDATE PAYMENT (IMPROVED)
  // ============================================

  openUpdateModal(sale: Sales): void {
    this.selectedSale = sale;
    this.validationErrors = {};
    this.errorMessage = '';

    this.updatePaymentData = {
      amount: sale.dueAmount > 0 ? sale.dueAmount : 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethodId: 0,
      trackingId: '',
      description: ''
    };
  }

  addPaymentToSale(): void {
    if (!this.selectedSale || this.isLoading) return;

    // Validation
    this.validationErrors = {};

    if (!this.updatePaymentData.date) {
      this.validationErrors['date'] = ['Payment date is required'];
      return;
    }

    if (!this.updatePaymentData.paymentMethodId || this.updatePaymentData.paymentMethodId === 0) {
      this.validationErrors['paymentMethodId'] = ['Payment method is required'];
      return;
    }

    const paymentDto = {
      saleId: this.selectedSale.id,
      amount: Number(this.updatePaymentData.amount),
      incomeDate: this.updatePaymentData.date,
      paymentMethodId: Number(this.updatePaymentData.paymentMethodId),
      trackingId: this.updatePaymentData.trackingId?.trim() || '',
      description: this.updatePaymentData.description?.trim() || `Payment for Invoice ${this.selectedSale.invoiceNo}`
    };

    this.isLoading = true;

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
            this.handleCrudSuccess('Payment added successfully', ModalType.UPDATE);
            this.loadItems();
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

  // ============================================
  // OTHER OPERATIONS
  // ============================================

  // approvePayment(sale: Sales): void {
  //   if (sale.dueAmount <= 0) {
  //     this.errorMessage = 'No due amount to approve';
  //     setTimeout(() => this.clearError(), 3000);
  //     return;
  //   }

  //   if (!confirm(`Are you sure you want to approve payment of ${sale.dueAmount.toFixed(2)} for invoice ${sale.invoiceNo}?`)) {
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.service.approvePayment(sale.id)
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       finalize(() => this.isLoading = false)
  //     )
  //     .subscribe({
  //       next: (response: any) => {
  //         if (response.success) {
  //           this.loadItems();
  //           this.closeModal(ModalType.VIEW);
  //         } else {
  //           this.errorMessage = response.message || 'Failed to approve payment';
  //           setTimeout(() => this.clearError(), 3000);
  //         }
  //       },
  //       error: (error: any) => this.handleError('Failed to approve payment', error)
  //     });
  // }

  printSaleMemo(): void {
    if (!this.selectedSale) return;

    this.service.downloadInvoice(this.selectedSale.id).subscribe(res => {

      const blob = new Blob([res.body!], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.print();

        iframe.contentWindow!.onafterprint = () => {
          URL.revokeObjectURL(blobUrl);
          document.body.removeChild(iframe);
        };
      };
    });
  }

  /**
 * Share invoice via email
 */
shareInvoice(sale: Sales): void {
  if (!sale || !sale.id) {
    this.errorMessage = 'Invalid sale selected';
    setTimeout(() => this.clearError(), 3000);
    return;
  }

  if (!sale.email || sale.email.trim() === '') {
    this.errorMessage = 'Customer email is not available. Please update customer information first.';
    setTimeout(() => this.clearError(), 5000);
    return;
  }

  const confirmMessage = `Send invoice ${sale.invoiceNo} to ${sale.email}?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.service.emailInvoice(sale.id, sale.email)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(`Invoice sent successfully to ${sale.email}`);
        } else {
          this.errorMessage = response.message || 'Failed to send invoice';
          setTimeout(() => this.clearError(), 5000);
        }
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to send invoice email';
        setTimeout(() => this.clearError(), 5000);
      }
    });
}


  openCencelModal(sales: Sales): void {
    this.selectedSale = { ...sales, cancelReason: '' };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  submitCancelReason(): void {
    if (!this.selectedSale || !this.selectedSale.cancelReason?.trim()) {
      this.errorMessage = 'Please provide a cancellation reason';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.service.cancelExpense(this.selectedSale.id, this.selectedSale.cancelReason.trim())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadItems();
            this.closeModal(ModalType.CANCEL);
          } else {
            this.errorMessage = response.message || 'Failed to cancel sale';
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => {
          this.handleError('Failed to cancel sale', error);
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
    if (this.selectedSale && !this.isLoading) {
      this.deleteItem(this.selectedSale, this.selectedSale.invoiceNo);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

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
      payments: [],
      subTotal: 0,
      vat: 0,
      discount: 0,
      totalPrice: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'PENDING'
    };
    this.resetCurrentItem();
    this.resetCurrentPayment();
    this.customerFound = false;
    this.paymentEditIndex = null;
    this.editIndex = null;
    this.validationErrors = {};
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
        this.errorMessage = 'Failed to load payment methods';
        setTimeout(() => this.clearError(), 3000);
      }
    });
  }

  loadProducts(): void {
    this.productService.getAllProducts('', true).subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.filteredProducts = this.products.slice(0, 10);
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.errorMessage = 'Failed to load products';
        setTimeout(() => this.clearError(), 3000);
      }
    });
  }

  get sales(): Sales[] {
    return this.items;
  }

  get filteredSales(): Sales[] {
    return this.items;
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }






  /**
 * Handle post-sale actions: Auto print and email
 */
private handlePostSaleActions(sale: Sales): void {
  setTimeout(() => {
    // 1. Auto-print invoice
    this.printInvoiceAuto(sale.id);

    // 2. Auto-send email if customer has email
    if (sale.email && sale.email.trim() !== '') {
      this.emailInvoiceAuto(sale.id, sale.email);
    }
  }, 500); // Small delay to ensure modal is closed
}

/**
 * Automatically print invoice
 */
private printInvoiceAuto(saleId: number): void {
  this.service.downloadInvoice(saleId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        const blob = new Blob([res.body!], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          iframe.contentWindow?.print();
          iframe.contentWindow!.onafterprint = () => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(iframe);
          };
        };
      },
      error: (error) => {
        console.error('Auto-print failed:', error);
      }
    });
}

/**
 * Automatically send invoice email
 */
private emailInvoiceAuto(saleId: number, email: string): void {
  this.service.emailInvoice(saleId, email)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showToast(`✓ Invoice sent to ${email}`, 'success');
        }
      },
      error: (error) => {
        console.error('Auto-email failed:', error);
      }
    });
}

/**
 * Show toast notification
 */
private showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const bgColor = type === 'success' ? '#28a745' : '#dc3545';
  const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideInRight 0.3s ease-out;
  `;
  toast.innerHTML = `
    <i class="bi bi-${icon}" style="font-size: 20px;"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 4000);
}
}