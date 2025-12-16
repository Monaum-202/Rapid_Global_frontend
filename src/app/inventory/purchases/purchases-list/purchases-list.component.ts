import { Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, takeUntil, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { ExpenseService } from 'src/app/core/services/expense/expense.service';
import { ToastService } from 'src/app/core/services/feature/toast.service';
import { Purchase, PurchaseItem, PurchaseReqDto, PurchaseService } from 'src/app/core/services/purchase/purchase.service';
import { Product, ProductService } from 'src/app/core/services/product/product.service';
import { Supplier, SupplierService } from 'src/app/core/services/supplier/supplier.service';

enum ModalType {
  VIEW = 'purchaseViewModal',
  FORM = 'purchaseFormModal',
  RECEIVE = 'receiveGoodsModal',
  CANCEL = 'cancelReasonModal',
  UPDATE = 'updatePurchaseModal'
}

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchases-list.component.html',
  styleUrls: ['./purchases-list.component.css']
})
export class PurchasesListComponent extends simpleCrudComponent<Purchase, PurchaseReqDto> implements OnInit, OnDestroy {
  entityName = 'Purchase';
  entityNameLower = 'purchase';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  paymentMethod: PaymentMethod[] = [];
  roleId = 0;
  userId = 0;
  submitted = false;
  editIndex: number | null = null;
  isSearchingSupplier = false;
  supplierFound = false;

  // Raw Material search related
  product: Product[] = [];
  filteredProducts: Product[] = [];
  isSearchingMaterial = false;
  showMaterialDropdown = false;
  materialSearchSubject = new Subject<string>();
  private materialSearchSubscription?: any;

  selectedPurchase: Purchase | null = null;
  private modalInstances: Map<string, any> = new Map();

  formData = {
    supplierName: '',
    phone: '',
    email: '',
    address: '',
    companyName: '',
    contactPerson: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
    items: [] as PurchaseItem[],
    payments: [] as any[],
    subTotal: 0,
    vat: 0,
    discount: 0,
    totalPrice: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: 'PENDING'
  };

  currentItem: PurchaseItem = {
    rawMaterialName: '',
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

  columns: TableColumn<Purchase>[] = [
    { key: 'purchaseNo', label: 'Purchase No', visible: true },
    { key: 'supplierName', label: 'Supplier Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'purchaseDate', label: 'Date', visible: true },
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

  receiveGoodsData = {
    receivedDate: new Date().toISOString().split('T')[0],
    items: [] as {
      purchaseItemId: number;
      rawMaterialName: string;
      orderedQty: number;
      alreadyReceived: number;
      receiveNow: number;
    }[],
    notes: ''
  };

  constructor(
    public service: PurchaseService,
    public expenseService: ExpenseService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService,
    private supplierService: SupplierService,
    public paymentMethodService: PaymentMethodService,
    private prductService: ProductService,
    protected override toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Purchase List');
    this.loadItems();
    this.loadPaymentMethods();
    this.loadProducts();
    this.setupMaterialSearch();

    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.materialSearchSubscription) {
      this.materialSearchSubscription.unsubscribe();
    }
    this.materialSearchSubject.complete();
  }

  createNew(): Purchase {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 0,
      purchaseNo: '',
      supplierName: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      contactPerson: '',
      purchaseDate: today,
      deliveryDate: '',
      receivedDate: '',
      notes: '',
      subTotal: 0,
      vat: 0,
      discount: 0,
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'PENDING',
      items: [],
      payments: []
    };
  }

  mapToDto(purchase: Purchase): PurchaseReqDto {
    return {
      supplierName: this.formData.supplierName.trim(),
      phone: this.formData.phone.trim(),
      email: this.formData.email?.trim() || '',
      address: this.formData.address?.trim() || '',
      companyName: this.formData.companyName?.trim() || '',
      contactPerson: this.formData.contactPerson?.trim() || '',
      purchaseDate: this.formData.purchaseDate,
      deliveryDate: this.formData.deliveryDate || null,
      notes: this.formData.notes?.trim() || '',
      discount: this.formData.discount,
      vat: this.formData.vat,
      status: this.formData.status,
      items: this.formData.items,
      payments: this.formData.payments.map(p => ({
        amount: p.amount,
        paymentMethodId: p.paymentMethodId,
        paymentDate: this.formData.purchaseDate,
        description: `Payment for Purchase Order`,
        trackingId: p.trackingId || ''
      }))
    };
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    if (!this.formData.phone || this.formData.phone.trim().length < 11) {
      this.validationErrors['phone'] = ['Phone number must be at least 11 digits'];
      this.toastService.warning('Phone number must be at least 11 digits');
      isValid = false;
    }

    if (!this.formData.supplierName || this.formData.supplierName.trim().length < 2) {
      this.validationErrors['supplierName'] = ['Supplier name is required (min 2 characters)'];
      this.toastService.warning('Supplier name is required (min 2 characters)');
      isValid = false;
    }

    if (this.formData.email && this.formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.formData.email)) {
        this.validationErrors['email'] = ['Please enter a valid email address'];
        this.toastService.warning('Please enter a valid email address');
        isValid = false;
      }
    }

    if (!this.formData.purchaseDate) {
      this.validationErrors['purchaseDate'] = ['Purchase date is required'];
      this.toastService.warning('Purchase date is required');
      isValid = false;
    }

    if (!this.formData.items || this.formData.items.length === 0) {
      this.validationErrors['items'] = ['At least one item is required'];
      this.toastService.warning('At least one item is required');
      isValid = false;
    }

    if (!this.isEditMode) {
      const totalPayments = this.formData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (totalPayments > this.formData.totalPrice) {
        this.validationErrors['payment'] = ['Total payments cannot exceed total amount'];
        this.toastService.warning('Total payments cannot exceed total amount');
        isValid = false;
      }
    }

    return isValid;
  }

  validateCurrentItem(): boolean {
    if (!this.currentItem.rawMaterialName || this.currentItem.rawMaterialName.trim() === '') {
      this.toastService.warning('Raw material name is required');
      return false;
    }

    if (this.currentItem.quantity <= 0) {
      this.toastService.warning('Quantity must be greater than 0');
      return false;
    }

    if (this.currentItem.unitPrice < 0) {
      this.toastService.warning('Unit price cannot be negative');
      return false;
    }

    return true;
  }

  validateCurrentPayment(): boolean {
    this.validationErrors['payment'] = [];

    if (!this.currentPayment.amount || this.currentPayment.amount <= 0) {
      this.toastService.warning('Payment amount must be greater than 0');
      return false;
    }

    if (!this.currentPayment.paymentMethodId || this.currentPayment.paymentMethodId === 0) {
      this.toastService.warning('Payment method is required');
      return false;
    }

    const totalPayments = this.formData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const newTotal = this.paymentEditIndex !== null
      ? totalPayments - this.formData.payments[this.paymentEditIndex].amount + this.currentPayment.amount
      : totalPayments + this.currentPayment.amount;

    if (newTotal > this.formData.totalPrice) {
      this.toastService.warning(`Total payments (${newTotal.toFixed(2)}) cannot exceed total amount (${this.formData.totalPrice.toFixed(2)})`);
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
    this.supplierFound = false;
    this.submitted = false;
  }

  viewPurchase(purchase: Purchase): void {
    this.selectedPurchase = purchase;
  }

  editPurchase(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    this.supplierFound = true;
    this.submitted = false;

    this.formData = {
      supplierName: purchase.supplierName,
      phone: purchase.phone,
      email: purchase.email || '',
      address: purchase.address || '',
      companyName: purchase.companyName || '',
      contactPerson: purchase.contactPerson || '',
      purchaseDate: purchase.purchaseDate,
      deliveryDate: purchase.deliveryDate || '',
      notes: purchase.notes || '',
      items: JSON.parse(JSON.stringify(purchase.items)),
      payments: [],
      subTotal: purchase.subTotal,
      vat: purchase.vat,
      discount: purchase.discount,
      totalPrice: purchase.totalAmount,
      paidAmount: purchase.paidAmount,
      dueAmount: purchase.dueAmount,
      status: purchase.status
    };
  }

  // ============================================
  // SUPPLIER SEARCH
  // ============================================

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const phone = input.value;
    this.formData.phone = phone;
    this.supplierFound = false;

    if (!phone || phone.length < 3) {
      this.clearSupplierFields();
    }
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const phone = this.formData.phone.trim();

      if (phone && phone.length >= 11) {
        this.searchSupplierByPhone(phone);
      } else {
        this.validationErrors['phone'] = ['Phone number must be at least 11 digits'];
      }
    }
  }

  searchSupplierByPhone(phone: string): void {
    if (this.isSearchingSupplier) return;

    this.isSearchingSupplier = true;
    this.validationErrors['phone'] = [];

    this.supplierService.getByPhone(phone)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSearchingSupplier = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.populateSupplierData(response.data);
            this.supplierFound = true;
            this.toastService.success('Supplier found');
          } else {
            this.clearSupplierFields();
            this.supplierFound = false;
            this.toastService.info(response.message || 'Supplier not found. You can add new supplier details.');
          }
        },
        error: (err: any) => {
          this.clearSupplierFields();
          this.supplierFound = false;
          this.toastService.info('Supplier not found. You can add new supplier details.');
        }
      });
  }

  populateSupplierData(supplier: Supplier): void {
    this.formData.supplierName = supplier.name || '';
    this.formData.email = supplier.email || '';
    this.formData.address = supplier.address || '';
    this.formData.companyName = supplier.companyName || '';
    this.formData.contactPerson = supplier.contactPerson || '';
  }

  clearSupplierFields(): void {
    if (!this.supplierFound) {
      this.formData.supplierName = '';
      this.formData.email = '';
      this.formData.address = '';
      this.formData.companyName = '';
      this.formData.contactPerson = '';
    }
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  calculateItemTotal(): void {
    const quantity = Number(this.currentItem.quantity) || 0;
    const unitPrice = Number(this.currentItem.unitPrice) || 0;
    this.currentItem.totalPrice = quantity * unitPrice;
  }

  addItemToList(): void {
    if (!this.validateCurrentItem()) return;

    const newItem = {
      rawMaterialName: this.currentItem.rawMaterialName.trim(),
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

  editPurchaseItem(index: number): void {
    this.editIndex = index;
    const item = this.formData.items[index];
    this.currentItem = {
      rawMaterialName: item.rawMaterialName,
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
    this.currentItem = { rawMaterialName: '', unitName: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
    this.editIndex = null;
  }

  updateSubTotal(): void {
    this.formData.subTotal = this.formData.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    this.calculateTotals();
  }

  // ============================================
  // PAYMENT MANAGEMENT
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
  // CALCULATIONS
  // ============================================

  calculateTotals(): void {
    this.formData.subTotal = this.formData.items.reduce((sum, item) =>
      sum + (Number(item.totalPrice) || 0), 0
    );

    const vatAmount = (this.formData.subTotal * Number(this.formData.vat)) / 100;
    this.formData.totalPrice = this.formData.subTotal + vatAmount - Number(this.formData.discount);

    if (this.formData.totalPrice < 0) {
      this.formData.totalPrice = 0;
    }

    this.formData.paidAmount = this.formData.payments.reduce((sum, payment) =>
      sum + (Number(payment.amount) || 0), 0
    );

    this.formData.dueAmount = this.formData.totalPrice - this.formData.paidAmount;
    if (this.formData.dueAmount < 0) {
      this.formData.dueAmount = 0;
    }
  }

  calculateRemainingDue(): number {
    if (!this.selectedPurchase) return 0;
    const remainingDue = this.selectedPurchase.dueAmount - (Number(this.updatePaymentData.amount) || 0);
    return remainingDue < 0 ? 0 : remainingDue;
  }

  // ============================================
  // RAW MATERIAL SEARCH
  // ============================================

  setupMaterialSearch(): void {
    this.materialSearchSubscription = this.materialSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterMaterials(searchTerm);
    });
  }

  onMaterialSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value;
    this.currentItem.rawMaterialName = searchTerm;
    this.showMaterialDropdown = true;
    this.materialSearchSubject.next(searchTerm);
  }

  filterMaterials(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredProducts = this.product.slice(0, 10);
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredProducts = this.product
      .filter(product => product.name.toLowerCase().includes(search))
      .slice(0, 10);
  }

  selectMaterial(product: Product): void {
    this.currentItem.rawMaterialName = product.name;
    this.currentItem.unitName = product.unitName || '';
    this.currentItem.unitPrice = product.pricePerUnit || 0;
    this.calculateItemTotal();
    this.showMaterialDropdown = false;
  }

  hideMaterialDropdown(): void {
    setTimeout(() => {
      this.showMaterialDropdown = false;
    }, 200);
  }

  // ============================================
  // SAVE/UPDATE OPERATIONS
  // ============================================

  savePurchaseForm(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      this.errorMessage = 'Please fix all validation errors before submitting';
      setTimeout(() => this.clearError(), 5000);
      return;
    }

    this.calculateTotals();

    if (this.isEditMode) {
      this.updatePurchase();
    } else {
      this.createPurchase();
    }
  }

  createPurchase(): void {
    if (this.isLoading) return;

    const purchase: Purchase = {
      id: 0,
      purchaseNo: '',
      supplierName: this.formData.supplierName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      contactPerson: this.formData.contactPerson,
      purchaseDate: this.formData.purchaseDate,
      deliveryDate: this.formData.deliveryDate,
      notes: this.formData.notes,
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      paidAmount: this.formData.paidAmount,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items
    };

    const dto = this.mapToDto(purchase);
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
            this.toastService.error(response.message || 'Validation Failed');
          } else if (response.success) {
            this.toastService.success(response.message || 'Purchase created successfully');
            this.handleCrudSuccess('Purchase created successfully', ModalType.FORM);
            this.resetFormData();
            this.submitted = false;
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to create purchase';
            this.toastService.error(errorMsg);
            this.handleError('Failed to create purchase', error);
          }
        }
      });
  }

  updatePurchase(): void {
    if (!this.selectedPurchase?.id || this.isLoading) return;

    const purchase: Purchase = {
      id: this.selectedPurchase.id,
      purchaseNo: this.selectedPurchase.purchaseNo,
      supplierName: this.formData.supplierName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      contactPerson: this.formData.contactPerson,
      purchaseDate: this.formData.purchaseDate,
      deliveryDate: this.formData.deliveryDate,
      notes: this.formData.notes,
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      paidAmount: this.formData.paidAmount,
      dueAmount: this.formData.dueAmount,
      status: this.formData.status,
      items: this.formData.items
    };

    const dto = this.mapToDto(purchase);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedPurchase.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.toastService.error(response.message || 'Validation Failed');
          } else if (response.success) {
            this.toastService.success(response.message || 'Purchase updated successfully');
            this.handleCrudSuccess('Purchase updated successfully', ModalType.FORM);
            this.submitted = false;
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to update purchase';
            this.toastService.error(errorMsg);
            this.handleError('Failed to update purchase', error);
          }
        }
      });
  }

  // ============================================
  // RECEIVE GOODS
  // ============================================

  openReceiveGoodsModal(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.receiveGoodsData = {
      receivedDate: new Date().toISOString().split('T')[0],
      items: purchase.items.map(item => ({
        purchaseItemId: item.id || 0,
        rawMaterialName: item.rawMaterialName,
        orderedQty: item.quantity,
        alreadyReceived: item.receivedQuantity || 0,
        receiveNow: item.quantity - (item.receivedQuantity || 0)
      })),
      notes: ''
    };
  }

  submitReceiveGoods(): void {
    if (!this.selectedPurchase || this.isLoading) return;

    const dto = {
      purchaseId: this.selectedPurchase.id,
      receivedDate: this.receiveGoodsData.receivedDate,
      items: this.receiveGoodsData.items.map(item => ({
        purchaseItemId: item.purchaseItemId,
        receivedQuantity: item.receiveNow
      })),
      notes: this.receiveGoodsData.notes
    };

    this.isLoading = true;

    this.service.receiveGoods(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Goods received successfully');
            this.handleCrudSuccess('Goods received successfully', ModalType.RECEIVE);
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to receive goods');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to receive goods';
          this.toastService.error(errorMsg);
          this.handleError('Failed to receive goods', error);
        }
      });
  }

  // ============================================
  // UPDATE PAYMENT
  // ============================================

  openUpdateModal(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.validationErrors = {};
    this.errorMessage = '';

    this.updatePaymentData = {
      amount: purchase.dueAmount > 0 ? purchase.dueAmount : 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethodId: 0,
      trackingId: '',
      description: ''
    };
  }

  addPaymentToPurchase(): void {
    if (!this.selectedPurchase || this.isLoading) return;

    // Validation
    this.validationErrors = {};

    if (!this.updatePaymentData.date) {
      this.toastService.warning('Payment date is required');
      return;
    }

    if (!this.updatePaymentData.paymentMethodId || this.updatePaymentData.paymentMethodId === 0) {
      this.toastService.warning('Payment method is required');
      return;
    }

    const paymentDto = {
      purchaseId: this.selectedPurchase.id,
      amount: Number(this.updatePaymentData.amount),
      paymentDate: this.updatePaymentData.date,
      paymentMethodId: Number(this.updatePaymentData.paymentMethodId),
      trackingId: this.updatePaymentData.trackingId?.trim() || '',
      description: this.updatePaymentData.description?.trim() || `Payment for Purchase ${this.selectedPurchase.purchaseNo}`
    };

    this.isLoading = true;

    this.service.addPayment(paymentDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.toastService.error(response.message || 'Validation Failed');
          } else if (response.success) {
            this.toastService.success(response.message || 'Payment added successfully');
            this.handleCrudSuccess('Payment added successfully', ModalType.UPDATE);
            this.loadItems();
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to add payment';
            this.toastService.error(errorMsg);
            this.handleError('Failed to add payment', error);
          }
        }
      });
  }

  // ============================================
  // OTHER OPERATIONS
  // ============================================

  printPurchaseOrder(): void {
    if (!this.selectedPurchase) return;

    this.service.downloadPurchaseOrder(this.selectedPurchase.id).subscribe(res => {
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

  emailPurchaseOrder(purchase: Purchase): void {
    if (!purchase || !purchase.id) {
      this.toastService.error('Invalid purchase selected');
      return;
    }

    if (!purchase.email || purchase.email.trim() === '') {
      this.toastService.warning('Supplier email is not available. Please update supplier information first.');
      return;
    }

    const confirmMessage = `Send purchase order ${purchase.purchaseNo} to ${purchase.email}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isLoading = true;

    this.service.emailPurchaseOrder(purchase.id, purchase.email)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success(`Purchase order sent successfully to ${purchase.email}`);
          } else {
            this.toastService.error(response.message || 'Failed to send purchase order');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to send purchase order email';
          this.toastService.error(errorMsg);
        }
      });
  }

  openCancelModal(purchase: Purchase): void {
    this.selectedPurchase = { ...purchase, cancelReason: '' };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  submitCancelReason(): void {
    if (!this.selectedPurchase || !this.selectedPurchase.cancelReason?.trim()) {
      this.toastService.warning('Please provide a cancellation reason');
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.service.cancelPurchase(this.selectedPurchase.id, this.selectedPurchase.cancelReason.trim())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Purchase canceled successfully');
            this.loadItems();
            this.closeModal(ModalType.CANCEL);
          } else {
            this.toastService.error(response.message || 'Failed to cancel purchase');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to cancel purchase';
          this.toastService.error(errorMsg);
          this.handleError('Failed to cancel purchase', error);
        }
      });
  }

  confirmDelete(): void {
    if (!this.selectedPurchase) {
      this.toastService.warning('No purchase selected');
      return;
    }

    const id = this.selectedPurchase.id;
    const purchaseNo = this.selectedPurchase.purchaseNo;

    this.isLoading = true;
    this.service.deletePurchase(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || `Purchase ${purchaseNo} deleted successfully`);
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to delete purchase');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to delete purchase';
          this.toastService.error(errorMsg);
          this.handleError('Failed to delete purchase', error);
        }
      });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  resetFormData(): void {
    const today = new Date().toISOString().split('T')[0];
    this.formData = {
      supplierName: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      contactPerson: '',
      purchaseDate: today,
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
    this.supplierFound = false;
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
        this.toastService.error('Failed to load payment methods');
      }
    });
  }

  loadProducts(): void {
    this.prductService.getAllProducts('', true).subscribe({
      next: (res) => {
        this.product = res.data || [];
        this.filteredProducts = this.product.slice(0, 10);
      },
      error: (err) => {
        console.error('Failed to load raw materials', err);
        this.toastService.error('Failed to load raw materials');
      }
    });
  }

  get purchases(): Purchase[] {
    return this.items;
  }

  get filteredPurchases(): Purchase[] {
    return this.items;
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }
}