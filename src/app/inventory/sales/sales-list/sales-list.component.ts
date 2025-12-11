import { Component, OnInit } from '@angular/core';
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
  editIndex: number | null = null;
  isSearchingCustomer = false;
  customerFound = false;

  // Product search related
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isSearchingProduct = false;
  showProductDropdown = false;
  productSearchSubject = new Subject<string>();

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

  get sales(): Sales[] {
    return this.items;
  }

  get filteredSales(): Sales[] {
    return this.items;
  }

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
      paymentMethodId: 0, // Not used when payments array exists
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
      payments: [], // Don't include existing payments in edit mode
      subTotal: sale.subTotal,
      vat: sale.vat,
      discount: sale.discount,
      totalPrice: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      status: sale.status
    };
  }

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
    this.formData.customerName = '';
    this.formData.email = '';
    this.formData.address = '';
    this.formData.companyName = '';
  }

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
            this.handleCrudSuccess('Sale created successfully', ModalType.FORM);
            this.validationErrors = {};
            this.resetFormData();
            this.submitted = false;
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
            this.validationErrors = {};
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

  calculateItemTotal() {
    this.currentItem.totalPrice = (this.currentItem.quantity || 0) * (this.currentItem.unitPrice || 0);
  }

  addItemToList() {
    if (!this.currentItem.itemName || this.currentItem.quantity <= 0 || this.currentItem.unitPrice < 0) return;

    if (this.editIndex !== null) {
      this.formData.items[this.editIndex] = { ...this.currentItem };
      this.editIndex = null;
    } else {
      this.formData.items.push({ ...this.currentItem });
    }

    this.resetCurrentItem();
    this.updateSubTotal();
  }

  editSalesItem(index: number) {
    this.editIndex = index;
    this.currentItem = { ...this.formData.items[index] };
  }

  removeItem(index: number) {
    this.formData.items.splice(index, 1);
    this.updateSubTotal();
  }

  resetCurrentItem() {
    this.currentItem = { itemName: '', unitName: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
  }

  updateSubTotal() {
    this.formData.subTotal = this.formData.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.formData.subTotal = this.formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = (this.formData.subTotal * this.formData.vat) / 100;
    this.formData.totalPrice = this.formData.subTotal + vatAmount - this.formData.discount;

    // Calculate paid amount from payments array
    this.formData.paidAmount = this.formData.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    this.formData.dueAmount = this.formData.totalPrice - this.formData.paidAmount;

    if (this.formData.dueAmount < 0) {
      this.formData.dueAmount = 0;
    }
  }

  // Payment Management Methods (like Item Management)
  addPaymentToList(): void {
    if (!this.currentPayment.amount || this.currentPayment.amount <= 0) {
      this.validationErrors['payment'] = ['Payment amount is required'];
      return;
    }

    if (!this.currentPayment.paymentMethodId || this.currentPayment.paymentMethodId === 0) {
      this.validationErrors['payment'] = ['Payment method is required'];
      return;
    }

    // Check if total payments would exceed total amount
    const totalPayments = this.formData.payments.reduce((sum, p) => sum + p.amount, 0);
    if (this.paymentEditIndex === null) {
      if (totalPayments + this.currentPayment.amount > this.formData.totalPrice) {
        this.validationErrors['payment'] = ['Total payments cannot exceed total amount'];
        return;
      }
    } else {
      const oldAmount = this.formData.payments[this.paymentEditIndex].amount;
      if (totalPayments - oldAmount + this.currentPayment.amount > this.formData.totalPrice) {
        this.validationErrors['payment'] = ['Total payments cannot exceed total amount'];
        return;
      }
    }

    if (this.paymentEditIndex !== null) {
      this.formData.payments[this.paymentEditIndex] = { ...this.currentPayment };
      this.paymentEditIndex = null;
    } else {
      this.formData.payments.push({ ...this.currentPayment });
    }

    this.resetCurrentPayment();
    this.calculateTotals();
    delete this.validationErrors['payment'];
  }

  editPayment(index: number): void {
    this.paymentEditIndex = index;
    this.currentPayment = { ...this.formData.payments[index] };
  }

  removePayment(index: number): void {
    this.formData.payments.splice(index, 1);
    this.calculateTotals();
  }

  resetCurrentPayment(): void {
    this.currentPayment = {
      amount: 0,
      paymentMethodId: 0,
      trackingId: ''
    };
  }

  getPaymentMethodName(id: number): string {
    const method = this.paymentMethod.find(m => m.id === id);
    return method ? method.name : 'Unknown';
  }

  calculateDueAfterPayment(index: number): number {
    // Calculate cumulative payments up to and including this payment
    let cumulativePaid = 0;
    for (let i = 0; i <= index; i++) {
      cumulativePaid += this.formData.payments[i].amount || 0;
    }
    const due = this.formData.totalPrice - cumulativePaid;
    return due < 0 ? 0 : due;
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

  loadProducts(): void {
    this.productService.getAllProducts('', true).subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.filteredProducts = [...this.products];
      },
      error: (err) => {
        console.error('Failed to load products', err);
      }
    });
  }

  setupProductSearch(): void {
    this.productSearchSubject.pipe(
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
      this.filteredProducts = [...this.products];
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(search)
    );
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

  calculateRemainingDue(): number {
    if (!this.selectedSale) return 0;
    const remainingDue = this.selectedSale.dueAmount - (this.updatePaymentData.amount || 0);
    return remainingDue < 0 ? 0 : remainingDue;
  }

  addPaymentToSale(): void {
    if (!this.selectedSale) return;

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
            this.loadItems();
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

  printSaleMemo(): void {
    if (!this.selectedSale) {
      this.errorMessage = 'No sale selected';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    this.isLoading = true;

    this.service.downloadInvoice(this.selectedSale.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        },
        error: (error: any) => {
          console.error('Failed to open invoice:', error);
          this.errorMessage = 'Failed to open invoice';
          setTimeout(() => this.clearError(), 3000);
        }
      });
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }
}