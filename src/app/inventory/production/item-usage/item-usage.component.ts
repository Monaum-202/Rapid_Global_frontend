import { Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, takeUntil, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Product, ProductService, ProductType } from 'src/app/core/services/product/product.service';
import { ToastService } from 'src/app/core/services/feature/toast.service';
import { ItemUsage, ItemUsageReqDto, ItemDTO, ItemUsageService } from 'src/app/core/services/itemUsage/item-usage.service';

enum ModalType {
  VIEW = 'viewModal',
  FORM = 'formModal',
  DELETE = 'deleteModal',
  CANCEL = 'cancelModal'
}

@Component({
  selector: 'app-item-usage',
  templateUrl: './item-usage.component.html',
  styleUrls: ['./item-usage.component.css']
})
export class ItemUsageComponent extends simpleCrudComponent<ItemUsage, ItemUsageReqDto> implements OnInit, OnDestroy {
  entityName = 'Item Usage';
  entityNameLower = 'item usage';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  itemEditIndex: number | null = null;

  // Product search
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isSearchingProduct = false;
  showProductDropdown = false;
  productSearchSubject = new Subject<string>();
  private productSearchSubscription?: any;

  selectedUsage: ItemUsage | null = null;

  formData = {
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    items: [] as ItemDTO[]
  };

  currentItem: ItemDTO = {
    productId: 0,
    itemName: '',
    unitName: '',
    quantity: 0,
    note: ''
  };

  columns: TableColumn<ItemUsage>[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'transactionDate', label: 'transactionDate', visible: true },
    { key: 'productName', label: 'productName', visible: true },
    { key: 'quantity', label: 'quantity', visible: true },
    { key: 'createdBy', label: 'Created By', visible: true }
  ];

  constructor(
    public service: ItemUsageService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService,
    private productService: ProductService,
    public override toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Stock Out / Item Usage');
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

  createNew(): ItemUsage {
    return {
      id: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      items: []
    };
  }

  mapToDto(usage: ItemUsage): ItemUsageReqDto {
    return {
      date: this.formData.date,
      status: this.formData.status,
      items: this.formData.items
    };
  }

  // ============================================
  // VALIDATION
  // ============================================

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    if (!this.formData.date) {
      this.validationErrors['date'] = ['Date is required'];
      this.toastService.warning('Date is required');
      isValid = false;
    }

    if (!this.formData.items || this.formData.items.length === 0) {
      this.validationErrors['items'] = ['At least one item is required'];
      this.toastService.warning('At least one item is required');
      isValid = false;
    }

    return isValid;
  }

  validateCurrentItem(): boolean {
    if (!this.currentItem.productId || this.currentItem.productId === 0) {
      this.toastService.warning('Please select a product');
      return false;
    }

    if (this.currentItem.quantity <= 0) {
      this.toastService.warning('Quantity must be greater than 0');
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
  }

  viewUsage(usage: ItemUsage): void {
    this.selectedUsage = usage;
  }

  editUsage(usage: ItemUsage): void {
    this.selectedUsage = usage;
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.formData = {
      date: usage.date,
      status: usage.status,
      items: JSON.parse(JSON.stringify(usage.items))
    };
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
    this.currentItem.productId = product.id;
    this.currentItem.itemName = product.name;
    this.currentItem.unitName = product.unitName || '';
    this.showProductDropdown = false;
  }

  hideProductDropdown(): void {
    setTimeout(() => {
      this.showProductDropdown = false;
    }, 200);
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  addItemToList(): void {
    if (!this.validateCurrentItem()) return;

    const newItem: ItemDTO = {
      productId: this.currentItem.productId,
      itemName: this.currentItem.itemName.trim(),
      unitName: this.currentItem.unitName.trim(),
      quantity: Number(this.currentItem.quantity),
      note: this.currentItem.note?.trim() || ''
    };

    if (this.itemEditIndex !== null) {
      this.formData.items[this.itemEditIndex] = newItem;
      this.itemEditIndex = null;
    } else {
      this.formData.items.push(newItem);
    }

    this.resetCurrentItem();
    delete this.validationErrors['items'];
  }

  editItemInList(index: number): void {
    this.itemEditIndex = index;
    const item = this.formData.items[index];
    this.currentItem = {
      productId: item.productId,
      itemName: item.itemName,
      unitName: item.unitName,
      quantity: item.quantity,
      note: item.note || ''
    };
  }

  // Override base class editItem to avoid conflict
  override editItem(item: ItemUsage): void {
    this.editUsage(item);
  }

  removeItem(index: number): void {
    if (confirm('Are you sure you want to remove this item?')) {
      this.formData.items.splice(index, 1);

      if (this.formData.items.length === 0) {
        this.validationErrors['items'] = ['At least one item is required'];
      }
    }
  }

  resetCurrentItem(): void {
    this.currentItem = {
      productId: 0,
      itemName: '',
      unitName: '',
      quantity: 0,
      note: ''
    };
    this.itemEditIndex = null;
  }

  // ============================================
  // SAVE/UPDATE
  // ============================================

  saveForm(): void {
    if (!this.validateForm()) {
      this.errorMessage = 'Please fix all validation errors';
      setTimeout(() => this.clearError(), 5000);
      return;
    }

    if (this.isEditMode && this.selectedUsage) {
      this.updateUsage();
    } else {
      this.createUsage();
    }
  }

  createUsage(): void {
    if (this.isLoading) return;

    const usage: ItemUsage = {
      id: 0,
      date: this.formData.date,
      status: this.formData.status as 'PENDING' | 'COMPLETED' | 'CANCELLED',
      items: this.formData.items


    };

    const dto = this.mapToDto(usage);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.stockOut(dto)
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
            this.toastService.success(response.message || 'Stock out recorded successfully');
            this.handleCrudSuccess('Stock out recorded successfully', ModalType.FORM);
            this.resetFormData();
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error?.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to record stock out';
            this.toastService.error(errorMsg);
            this.handleError('Failed to record stock out', error);
          }
        }
      });
  }

  updateUsage(): void {
    if (!this.selectedUsage?.id || this.isLoading) return;

    const usage: ItemUsage = {
      id: this.selectedUsage.id,
      date: this.formData.date,
      status: this.formData.status as 'PENDING' | 'COMPLETED' | 'CANCELLED',
      items: this.formData.items
    };

    const dto = this.mapToDto(usage);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedUsage.id, dto)
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
            this.toastService.success(response.message || 'Item usage updated successfully');
            this.handleCrudSuccess('Item usage updated successfully', ModalType.FORM);
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error?.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to update item usage';
            this.toastService.error(errorMsg);
            this.handleError('Failed to update item usage', error);
          }
        }
      });
  }

  // ============================================
  // DELETE & CANCEL
  // ============================================

  openCancelModal(usage: ItemUsage): void {
    this.selectedUsage = { ...usage, items: [] };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  submitCancelReason(): void {
    if (!this.selectedUsage || this.isLoading) return;

    this.isLoading = true;
    this.service.cancel(this.selectedUsage.id!, 'Cancelled by user')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Item usage cancelled successfully');
            this.loadItems();
            this.closeModal(ModalType.CANCEL);
          } else {
            this.toastService.error(response.message || 'Failed to cancel');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to cancel item usage';
          this.toastService.error(errorMsg);
        }
      });
  }

  confirmDelete(): void {
    if (!this.selectedUsage || this.isLoading) return;

    this.isLoading = true;
    this.service.deleteItemUsage(this.selectedUsage.id!)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Item usage deleted successfully');
            this.loadItems();
            this.closeModal(ModalType.DELETE);
          } else {
            this.toastService.error(response.message || 'Failed to delete');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to delete item usage';
          this.toastService.error(errorMsg);
        }
      });
  }

  // ============================================
  // UTILITIES
  // ============================================

  resetFormData(): void {
    this.formData = {
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      items: []
    };
    this.resetCurrentItem();
    this.validationErrors = {};
    this.itemEditIndex = null;
  }

  loadProducts(): void {
    this.productService
      .getAllProducts('', true, ProductType.RAW_MATERIAL)
      .subscribe({
        next: (res) => {
          this.products = res.data || [];
          this.filteredProducts = this.products.slice(0, 10);
        },
        error: (err) => {
          console.error('Failed to load products', err);
          this.toastService.error('Failed to load products');
        }
      });
  }

  get usages(): ItemUsage[] {
    return this.items;
  }

  get filteredUsages(): ItemUsage[] {
    return this.items;
  }
}