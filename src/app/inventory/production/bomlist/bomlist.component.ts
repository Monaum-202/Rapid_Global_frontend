import { Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, takeUntil, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { BOM, BOMReqDto, BOMService, BOMStatus, BOMItem } from 'src/app/core/services/bom/bom.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Product, ProductService, ProductType } from 'src/app/core/services/product/product.service';
import { ToastService } from 'src/app/core/services/feature/toast.service';

enum ModalType {
  VIEW = 'bomViewModal',
  FORM = 'bomFormModal',
  DELETE = 'confirmDeleteModal'
}
@Component({
  selector: 'app-bomlist',
  templateUrl: './bomlist.component.html',
  styleUrls: ['./bomlist.component.css']
})
export class BOMListComponent extends simpleCrudComponent<BOM, BOMReqDto> implements OnInit, OnDestroy {
  entityName = 'BOM';
  entityNameLower = 'bom';
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  submitted = false;
  editIndex: number | null = null;

  // Product search related
  finishedProducts: Product[] = [];
  rawMaterials: Product[] = [];
  filteredFinishedProducts: Product[] = [];
  filteredRawMaterials: Product[] = [];
  isSearchingFinishedProduct = false;
  isSearchingRawMaterial = false;
  showFinishedProductDropdown = false;
  showRawMaterialDropdown = false;
  finishedProductSearchSubject = new Subject<string>();
  rawMaterialSearchSubject = new Subject<string>();

  selectedBOM: BOM | null = null;
  BOMStatus = BOMStatus;

  formData = {
    bomName: '',
    finishedProductId: 0,
    finishedProductName: '',
    outputQuantity: 1,
    outputUnit: 'pcs',
    description: '',
    productionNotes: '',
    laborCost: 0,
    overheadCost: 0,
    estimatedTimeMinutes: 0,
    status: BOMStatus.DRAFT,
    isDefault: false,
    version: '1.0',
    items: [] as BOMItem[],
    estimatedCost: 0,
    totalCost: 0
  };

  currentItem: BOMItem = {
    rawMaterialId: 0,
    rawMaterialName: '',
    quantity: 1,
    unit: 'kg',
    unitCost: 0,
    totalCost: 0,
    notes: '',
    isOptional: false,
    sequenceOrder: 0
  };

  columns: TableColumn<BOM>[] = [
    { key: 'bomCode', label: 'BOM Code', visible: true },
    { key: 'bomName', label: 'BOM Name', visible: true },
    { key: 'finishedProductName', label: 'Product', visible: true },
    { key: 'outputQuantity', label: 'Output Qty', visible: true },
    { key: 'totalCost', label: 'Total Cost', visible: true },
    { key: 'estimatedTimeMinutes', label: 'Time', visible: false },
    { key: 'status', label: 'Status', visible: true },
    { key: 'isDefault', label: 'Default', visible: false }
  ];

  constructor(
    public service: BOMService,
    public pageHeaderService: PageHeaderService,
    public authService: AuthService,
    private productService: ProductService,
    public override toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Bill of Materials');
    this.loadItems();
    this.loadFinishedProducts();
    this.loadRawMaterials();
    this.setupProductSearch();

    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.finishedProductSearchSubject.complete();
    this.rawMaterialSearchSubject.complete();
  }

  createNew(): BOM {
    return {
      id: 0,
      bomCode: '',
      bomName: '',
      finishedProductId: 0,
      outputQuantity: 1,
      outputUnit: 'pcs',
      estimatedCost: 0,
      laborCost: 0,
      overheadCost: 0,
      totalCost: 0,
      estimatedTimeMinutes: 0,
      status: BOMStatus.DRAFT,
      isActive: true,
      isDefault: false,
      version: '1.0',
      items: []
    };
  }

  mapToDto(bom: BOM): BOMReqDto {
    return {
      bomName: this.formData.bomName.trim(),
      finishedProductId: this.formData.finishedProductId,
      outputQuantity: this.formData.outputQuantity,
      outputUnit: this.formData.outputUnit.trim(),
      description: this.formData.description?.trim() || '',
      productionNotes: this.formData.productionNotes?.trim() || '',
      laborCost: this.formData.laborCost,
      overheadCost: this.formData.overheadCost,
      estimatedTimeMinutes: this.formData.estimatedTimeMinutes,
      status: this.formData.status,
      isDefault: this.formData.isDefault,
      version: this.formData.version,
      items: this.formData.items.map(item => ({
        rawMaterialId: item.rawMaterialId,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes || '',
        isOptional: item.isOptional || false,
        sequenceOrder: item.sequenceOrder || 0
      }))
    };
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    if (!this.formData.bomName || this.formData.bomName.trim().length < 3) {
      this.validationErrors['bomName'] = ['BOM name is required (min 3 characters)'];
      this.toastService.warning('BOM name is required (min 3 characters)');
      isValid = false;
    }

    if (!this.formData.finishedProductId || this.formData.finishedProductId === 0) {
      this.validationErrors['finishedProductId'] = ['Finished product is required'];
      this.toastService.warning('Finished product is required');
      isValid = false;
    }

    if (this.formData.outputQuantity <= 0) {
      this.validationErrors['outputQuantity'] = ['Output quantity must be greater than 0'];
      this.toastService.warning('Output quantity must be greater than 0');
      isValid = false;
    }

    if (!this.formData.outputUnit || this.formData.outputUnit.trim() === '') {
      this.validationErrors['outputUnit'] = ['Output unit is required'];
      this.toastService.warning('Output unit is required');
      isValid = false;
    }

    if (!this.formData.items || this.formData.items.length === 0) {
      this.validationErrors['items'] = ['At least one raw material is required'];
      this.toastService.warning('At least one raw material is required');
      isValid = false;
    }

    return isValid;
  }

  validateCurrentItem(): boolean {
    if (!this.currentItem.rawMaterialId || this.currentItem.rawMaterialId === 0) {
      this.toastService.warning('Raw material is required');
      return false;
    }

    if (this.currentItem.quantity <= 0) {
      this.toastService.warning('Quantity must be greater than 0');
      return false;
    }

    if (!this.currentItem.unit || this.currentItem.unit.trim() === '') {
      this.toastService.warning('Unit is required');
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
    this.submitted = false;
  }

  viewBOM(bom: BOM): void {
    this.selectedBOM = bom;
  }

  editBOM(bom: BOM): void {
    this.selectedBOM = bom;
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    this.submitted = false;

    this.formData = {
      bomName: bom.bomName,
      finishedProductId: bom.finishedProductId,
      finishedProductName: bom.finishedProductName || '',
      outputQuantity: bom.outputQuantity,
      outputUnit: bom.outputUnit,
      description: bom.description || '',
      productionNotes: bom.productionNotes || '',
      laborCost: bom.laborCost,
      overheadCost: bom.overheadCost,
      estimatedTimeMinutes: bom.estimatedTimeMinutes,
      status: bom.status,
      isDefault: bom.isDefault,
      version: bom.version,
      items: JSON.parse(JSON.stringify(bom.items)),
      estimatedCost: bom.estimatedCost,
      totalCost: bom.totalCost
    };
  }

  // ============================================
  // PRODUCT SEARCH
  // ============================================

  setupProductSearch(): void {
    this.finishedProductSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterFinishedProducts(searchTerm);
    });

    this.rawMaterialSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterRawMaterials(searchTerm);
    });
  }

  onFinishedProductSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value;
    this.formData.finishedProductName = searchTerm;
    this.showFinishedProductDropdown = true;
    this.finishedProductSearchSubject.next(searchTerm);
  }

  filterFinishedProducts(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredFinishedProducts = this.finishedProducts.slice(0, 10);
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredFinishedProducts = this.finishedProducts
      .filter(product => product.name.toLowerCase().includes(search))
      .slice(0, 10);
  }

  selectFinishedProduct(product: Product): void {
    this.formData.finishedProductId = product.id;
    this.formData.finishedProductName = product.name;
    this.showFinishedProductDropdown = false;
  }

  hideFinishedProductDropdown(): void {
    setTimeout(() => {
      this.showFinishedProductDropdown = false;
    }, 200);
  }

  onRawMaterialSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value;
    this.currentItem.rawMaterialName = searchTerm;
    this.showRawMaterialDropdown = true;
    this.rawMaterialSearchSubject.next(searchTerm);
  }

  filterRawMaterials(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredRawMaterials = this.rawMaterials.slice(0, 10);
      return;
    }

    const search = searchTerm.toLowerCase();
    this.filteredRawMaterials = this.rawMaterials
      .filter(product => product.name.toLowerCase().includes(search))
      .slice(0, 10);
  }

  selectRawMaterial(product: Product): void {
    this.currentItem.rawMaterialId = product.id;
    this.currentItem.rawMaterialName = product.name;
    this.currentItem.unit = product.unitName || 'kg';
    this.currentItem.unitCost = product.pricePerUnit || 0;
    this.calculateItemTotal();
    this.showRawMaterialDropdown = false;
  }

  hideRawMaterialDropdown(): void {
    setTimeout(() => {
      this.showRawMaterialDropdown = false;
    }, 200);
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  calculateItemTotal(): void {
    const quantity = Number(this.currentItem.quantity) || 0;
    const unitCost = Number(this.currentItem.unitCost) || 0;
    this.currentItem.totalCost = quantity * unitCost;
  }

  addItemToList(): void {
    if (!this.validateCurrentItem()) return;

    const newItem: BOMItem = {
      rawMaterialId: this.currentItem.rawMaterialId,
      rawMaterialName: this.currentItem.rawMaterialName,
      quantity: Number(this.currentItem.quantity),
      unit: this.currentItem.unit.trim(),
      unitCost: Number(this.currentItem.unitCost),
      totalCost: Number(this.currentItem.totalCost),
      notes: this.currentItem.notes?.trim() || '',
      isOptional: this.currentItem.isOptional || false,
      sequenceOrder: this.currentItem.sequenceOrder || this.formData.items.length
    };

    if (this.editIndex !== null) {
      this.formData.items[this.editIndex] = newItem;
      this.editIndex = null;
    } else {
      this.formData.items.push(newItem);
    }

    this.resetCurrentItem();
    this.calculateTotals();
    delete this.validationErrors['items'];
  }

  editBOMItem(index: number): void {
    this.editIndex = index;
    const item = this.formData.items[index];
    this.currentItem = {
      rawMaterialId: item.rawMaterialId,
      rawMaterialName: item.rawMaterialName,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      notes: item.notes,
      isOptional: item.isOptional,
      sequenceOrder: item.sequenceOrder
    };
  }

  removeItem(index: number): void {
    if (confirm('Are you sure you want to remove this raw material?')) {
      this.formData.items.splice(index, 1);
      this.calculateTotals();

      if (this.formData.items.length === 0) {
        this.validationErrors['items'] = ['At least one raw material is required'];
      }
    }
  }

  resetCurrentItem(): void {
    this.currentItem = {
      rawMaterialId: 0,
      rawMaterialName: '',
      quantity: 1,
      unit: 'kg',
      unitCost: 0,
      totalCost: 0,
      notes: '',
      isOptional: false,
      sequenceOrder: 0
    };
    this.editIndex = null;
  }

  // ============================================
  // CALCULATIONS
  // ============================================

  calculateTotals(): void {
    this.formData.estimatedCost = this.formData.items.reduce(
      (sum, item) => sum + (Number(item.totalCost) || 0),
      0
    );

    this.formData.totalCost =
      this.formData.estimatedCost +
      Number(this.formData.laborCost) +
      Number(this.formData.overheadCost);
  }

  getCostPerUnit(): number {
    return this.formData.outputQuantity > 0
      ? this.formData.totalCost / this.formData.outputQuantity
      : 0;
  }

  // ============================================
  // SAVE/UPDATE OPERATIONS
  // ============================================

  saveBOMForm(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      this.errorMessage = 'Please fix all validation errors before submitting';
      setTimeout(() => this.clearError(), 5000);
      return;
    }

    this.calculateTotals();

    if (this.isEditMode) {
      this.updateBOM();
    } else {
      this.createBOM();
    }
  }

  createBOM(): void {
    if (this.isLoading) return;

    const bom: BOM = {
      ...this.createNew(),
      bomName: this.formData.bomName,
      finishedProductId: this.formData.finishedProductId,
      outputQuantity: this.formData.outputQuantity,
      outputUnit: this.formData.outputUnit,
      description: this.formData.description,
      productionNotes: this.formData.productionNotes,
      laborCost: this.formData.laborCost,
      overheadCost: this.formData.overheadCost,
      estimatedTimeMinutes: this.formData.estimatedTimeMinutes,
      status: this.formData.status,
      isDefault: this.formData.isDefault,
      version: this.formData.version,
      items: this.formData.items
    };

    const dto = this.mapToDto(bom);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response: any) => {
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.toastService.error(response.message || 'Validation Failed');
          } else if (response.success) {
            this.toastService.success(response.message || 'BOM created successfully');
            this.handleCrudSuccess('BOM created successfully', ModalType.FORM);
            this.resetFormData();
            this.submitted = false;
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to create BOM';
            this.toastService.error(errorMsg);
            this.handleError('Failed to create BOM', error);
          }
        }
      });
  }

  updateBOM(): void {
    if (!this.selectedBOM?.id || this.isLoading) return;

    const bom: BOM = {
      ...this.selectedBOM,
      bomName: this.formData.bomName,
      finishedProductId: this.formData.finishedProductId,
      outputQuantity: this.formData.outputQuantity,
      outputUnit: this.formData.outputUnit,
      description: this.formData.description,
      productionNotes: this.formData.productionNotes,
      laborCost: this.formData.laborCost,
      overheadCost: this.formData.overheadCost,
      estimatedTimeMinutes: this.formData.estimatedTimeMinutes,
      status: this.formData.status,
      isDefault: this.formData.isDefault,
      version: this.formData.version,
      items: this.formData.items
    };

    const dto = this.mapToDto(bom);
    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedBOM.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response: any) => {
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.toastService.error(response.message || 'Validation Failed');
          } else if (response.success) {
            this.toastService.success(response.message || 'BOM updated successfully');
            this.handleCrudSuccess('BOM updated successfully', ModalType.FORM);
            this.submitted = false;
          }
        },
        error: (error: any) => {
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.toastService.error(error.error.message || 'Validation Failed');
          } else {
            const errorMsg = error?.error?.message || 'Failed to update BOM';
            this.toastService.error(errorMsg);
            this.handleError('Failed to update BOM', error);
          }
        }
      });
  }

  // ============================================
  // OTHER OPERATIONS
  // ============================================

  approveBOM(bom: BOM): void {
    if (!confirm(`Approve BOM ${bom.bomCode}?`)) return;

    this.isLoading = true;
    this.service.approve(bom.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('BOM approved successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to approve BOM');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to approve BOM';
          this.toastService.error(errorMsg);
        }
      });
  }

  setAsDefault(bom: BOM): void {
    if (!confirm(`Set ${bom.bomCode} as default for this product?`)) return;

    this.isLoading = true;
    this.service.setAsDefault(bom.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('BOM set as default successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to set as default');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to set as default';
          this.toastService.error(errorMsg);
        }
      });
  }

  confirmDelete(): void {
    if (!this.selectedBOM) {
      this.toastService.warning('No BOM selected');
      return;
    }

    const id = this.selectedBOM.id;
    const bomCode = this.selectedBOM.bomCode;

    this.isLoading = true;
    this.service.deleteBOM(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || `BOM ${bomCode} deleted successfully`);
            this.loadItems();
            this.closeModal(ModalType.DELETE);
          } else {
            this.toastService.error(response.message || 'Failed to delete BOM');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to delete BOM';
          this.toastService.error(errorMsg);
          this.handleError('Failed to delete BOM', error);
        }
      });
  }

  openDeleteModal(bom: BOM): void {
    this.selectedBOM = bom;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  resetFormData(): void {
    this.formData = {
      bomName: '',
      finishedProductId: 0,
      finishedProductName: '',
      outputQuantity: 1,
      outputUnit: 'pcs',
      description: '',
      productionNotes: '',
      laborCost: 0,
      overheadCost: 0,
      estimatedTimeMinutes: 0,
      status: BOMStatus.DRAFT,
      isDefault: false,
      version: '1.0',
      items: [],
      estimatedCost: 0,
      totalCost: 0
    };
    this.resetCurrentItem();
    this.editIndex = null;
    this.validationErrors = {};
  }

  loadFinishedProducts(): void {
    this.productService
      .getAllProducts('', true, ProductType.FINISHED_GOODS)
      .subscribe({
        next: (res) => {
          this.finishedProducts = res.data || [];
          this.filteredFinishedProducts = this.finishedProducts.slice(0, 10);
        },
        error: (err) => {
          console.error('Failed to load finished products', err);
          this.toastService.error('Failed to load finished products');
        }
      });
  }

  loadRawMaterials(): void {
    this.productService
      .getAllProducts('', true, ProductType.RAW_MATERIAL)
      .subscribe({
        next: (res) => {
          this.rawMaterials = res.data || [];
          this.filteredRawMaterials = this.rawMaterials.slice(0, 10);
        },
        error: (err) => {
          console.error('Failed to load raw materials', err);
          this.toastService.error('Failed to load raw materials');
        }
      });
  }

  get boms(): BOM[] {
    return this.items;
  }

  get filteredBOMs(): BOM[] {
    return this.items;
  }

  getStatusBadgeClass(status: BOMStatus): string {
    return this.service.getStatusBadgeClass(status);
  }

  formatProductionTime(minutes: number): string {
    return this.service.formatProductionTime(minutes);
  }
}