import { Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, takeUntil, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Estimate, EstimateReqDto, EstimateService, EstimateItem } from 'src/app/core/services/estimate/estimate.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Customer, CustomerService } from 'src/app/core/services/customer/customer.service';
import { Product, ProductService } from 'src/app/core/services/product/product.service';
import { Router } from '@angular/router';

enum ModalType {
  VIEW = 'estimateViewModal',
  FORM = 'estimateFormModal',
  DELETE = 'confirmDeleteModal',
  CANCEL = 'cancelReasonModal',
  CONVERT = 'convertToSaleModal'
}

@Component({
  selector: 'app-estimate-list',
  templateUrl: './estimate-list.component.html',
  styleUrls: ['./estimate-list.component.css']
})
export class EstimateListComponent extends simpleCrudComponent<Estimate, EstimateReqDto> implements OnInit, OnDestroy {
  entityName = 'Estimate';
  entityNameLower = 'estimate';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
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

  selectedEstimate: Estimate | null = null;
  private modalInstances: Map<string, any> = new Map();

  formData = {
    customerName: '',
    phone: '',
    email: '',
    address: '',
    companyName: '',
    estimateDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
    items: [] as EstimateItem[],
    subTotal: 0,
    vat: 0,
    discount: 0,
    totalPrice: 0,
    status: 'PENDING'
  };

  currentItem: EstimateItem = {
    itemName: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    description: ''
  };

  convertToSaleData = {
    sellDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: ''
  };

  columns: TableColumn<Estimate>[] = [
    { key: 'estimateNo', label: 'Estimate No', visible: true },
    { key: 'customerName', label: 'Customer Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'estimateDate', label: 'Date', visible: true },
    { key: 'expiryDate', label: 'Expiry Date', visible: true },
    { key: 'totalAmount', label: 'Total Amount', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'convertedToSale', label: 'Converted', visible: true }
  ];

  constructor(
    public service: EstimateService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService,
    private customerService: CustomerService,
    private productService: ProductService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Estimates List');
    this.loadItems();
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

  createNew(): Estimate {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 0,
      estimateNo: '',
      customerName: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      estimateDate: today,
      expiryDate: '',
      notes: '',
      subTotal: 0,
      vat: 0,
      discount: 0,
      totalAmount: 0,
      status: 'PENDING',
      convertedToSale: false,
      items: []
    };
  }

  mapToDto(estimate: Estimate): EstimateReqDto {
    return {
      customerName: this.formData.customerName.trim(),
      phone: this.formData.phone.trim(),
      email: this.formData.email?.trim() || '',
      address: this.formData.address?.trim() || '',
      companyName: this.formData.companyName?.trim() || '',
      estimateDate: this.formData.estimateDate,
      expiryDate: this.formData.expiryDate,
      notes: this.formData.notes?.trim() || '',
      discount: this.formData.discount,
      vat: this.formData.vat,
      status: this.formData.status,
      items: this.formData.items
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
      isValid = false;
    }

    if (!this.formData.customerName || this.formData.customerName.trim().length < 2) {
      this.validationErrors['customerName'] = ['Customer name is required (min 2 characters)'];
      isValid = false;
    }

    if (this.formData.email && this.formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.formData.email)) {
        this.validationErrors['email'] = ['Please enter a valid email address'];
        isValid = false;
      }
    }

    if (!this.formData.estimateDate) {
      this.validationErrors['estimateDate'] = ['Estimate date is required'];
      isValid = false;
    }

    if (!this.formData.expiryDate) {
      this.validationErrors['expiryDate'] = ['Expiry date is required'];
      isValid = false;
    }

    if (this.formData.expiryDate && this.formData.estimateDate) {
      const estimateDate = new Date(this.formData.estimateDate);
      const expiryDate = new Date(this.formData.expiryDate);
      if (expiryDate < estimateDate) {
        this.validationErrors['expiryDate'] = ['Expiry date must be after estimate date'];
        isValid = false;
      }
    }

    if (!this.formData.items || this.formData.items.length === 0) {
      this.validationErrors['items'] = ['At least one item is required'];
      isValid = false;
    }

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

  viewEstimate(estimate: Estimate): void {
    this.selectedEstimate = estimate;
  }

  editEstimate(estimate: Estimate): void {
    this.selectedEstimate = estimate;
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    this.customerFound = true;
    this.submitted = false;

    this.formData = {
      customerName: estimate.customerName,
      phone: estimate.phone,
      email: estimate.email || '',
      address: estimate.address || '',
      companyName: estimate.companyName || '',
      estimateDate: estimate.estimateDate,
      expiryDate: estimate.expiryDate,
      notes: estimate.notes || '',
      items: JSON.parse(JSON.stringify(estimate.items)),
      subTotal: estimate.subTotal,
      vat: estimate.vat,
      discount: estimate.discount,
      totalPrice: estimate.totalAmount,
      status: estimate.status
    };
  }

  // ============================================
  // CUSTOMER SEARCH
  // ============================================

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const phone = input.value;
    this.formData.phone = phone;
    this.customerFound = false;

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
    if (this.isSearchingCustomer) return;

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
      itemName: this.currentItem.itemName.trim(),
      quantity: Number(this.currentItem.quantity),
      unitPrice: Number(this.currentItem.unitPrice),
      totalPrice: Number(this.currentItem.totalPrice),
      description: this.currentItem.description?.trim() || ''
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

  editEstimateItem(index: number): void {
    this.editIndex = index;
    const item = this.formData.items[index];
    this.currentItem = {
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      description: item.description || ''
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
    this.currentItem = { itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0, description: '' };
    this.editIndex = null;
  }

  updateSubTotal(): void {
    this.formData.subTotal = this.formData.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    this.calculateTotals();
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
  }

  // ============================================
  // PRODUCT SEARCH
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
      this.filteredProducts = this.products.slice(0, 10);
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredProducts = this.products
      .filter(product => product.name.toLowerCase().includes(search))
      .slice(0, 10);
  }

  selectProduct(product: Product): void {
    this.currentItem.itemName = product.name;
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
  // SAVE/UPDATE OPERATIONS
  // ============================================

  saveEstimateForm(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      this.errorMessage = 'Please fix all validation errors before submitting';
      setTimeout(() => this.clearError(), 5000);
      return;
    }

    this.calculateTotals();

    if (this.isEditMode) {
      this.updateEstimate();
    } else {
      this.createEstimate();
    }
  }

  createEstimate(): void {
    if (this.isLoading) return;

    const estimate: Estimate = {
      id: 0,
      estimateNo: '',
      customerName: this.formData.customerName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      estimateDate: this.formData.estimateDate,
      expiryDate: this.formData.expiryDate,
      notes: this.formData.notes,
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      status: this.formData.status,
      items: this.formData.items,
      convertedToSale: false
    };

    const dto = this.mapToDto(estimate);
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
            this.handleCrudSuccess('Estimate created successfully', ModalType.FORM);
            this.resetFormData();
            this.submitted = false;
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
          } else {
            this.handleError('Failed to create estimate', error);
          }
        }
      });
  }

  updateEstimate(): void {
    if (!this.selectedEstimate?.id || this.isLoading) return;

    const estimate: Estimate = {
      id: this.selectedEstimate.id,
      estimateNo: this.selectedEstimate.estimateNo,
      customerName: this.formData.customerName,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      companyName: this.formData.companyName,
      estimateDate: this.formData.estimateDate,
      expiryDate: this.formData.expiryDate,
      notes: this.formData.notes,
      subTotal: this.formData.subTotal,
      vat: this.formData.vat,
      discount: this.formData.discount,
      totalAmount: this.formData.totalPrice,
      status: this.formData.status,
      items: this.formData.items,
      convertedToSale: this.selectedEstimate.convertedToSale
    };

    const dto = this.mapToDto(estimate);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedEstimate.id, dto)
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
            this.handleCrudSuccess('Estimate updated successfully', ModalType.FORM);
            this.submitted = false;
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
          } else {
            this.handleError('Failed to update estimate', error);
          }
        }
      });
  }

  // ============================================
  // CONVERT TO SALE
  // ============================================

  openConvertModal(estimate: Estimate): void {
    this.selectedEstimate = estimate;
    this.convertToSaleData = {
      sellDate: new Date().toISOString().split('T')[0],
      deliveryDate: estimate.expiryDate,
      notes: estimate.notes || ''
    };
  }

  convertToSale(): void {
    if (!this.selectedEstimate || this.isLoading) return;

    if (!confirm(`Are you sure you want to convert estimate ${this.selectedEstimate.estimateNo} to a sale?`)) {
      return;
    }

    this.isLoading = true;

    this.service.convertToSale(this.selectedEstimate.id, this.convertToSaleData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.closeModal(ModalType.CONVERT);
            this.loadItems();

            // Navigate to sales page with the new sale ID
            if (response.data) {
              this.router.navigate(['/sales'], { queryParams: { saleId: response.data } });
            }
          } else {
            this.errorMessage = response.message || 'Failed to convert estimate';
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => this.handleError('Failed to convert estimate to sale', error)
      });
  }

  // ============================================
  // OTHER OPERATIONS
  // ============================================

  openCancelModal(estimate: Estimate): void {
    this.selectedEstimate = { ...estimate, cancelReason: '' };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  submitCancelReason(): void {
    if (!this.selectedEstimate || !this.selectedEstimate.cancelReason?.trim()) {
      this.errorMessage = 'Please provide a cancellation reason';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.service.cancelEstimate(this.selectedEstimate.id, this.selectedEstimate.cancelReason.trim())
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
            this.errorMessage = response.message || 'Failed to cancel estimate';
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => {
          this.handleError('Failed to cancel estimate', error);
        }
      });
  }

  openDeleteModal(estimate: Estimate): void {
    this.selectedEstimate = estimate;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedEstimate && !this.isLoading) {
      this.deleteItem(this.selectedEstimate, this.selectedEstimate.estimateNo);
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
      estimateDate: today,
      expiryDate: '',
      notes: '',
      items: [],
      subTotal: 0,
      vat: 0,
      discount: 0,
      totalPrice: 0,
      status: 'PENDING'
    };
    this.resetCurrentItem();
    this.customerFound = false;
    this.editIndex = null;
    this.validationErrors = {};
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

  get estimates(): Estimate[] {
    return this.items;
  }

  get filteredEstimates(): Estimate[] {
    return this.items;
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }
}