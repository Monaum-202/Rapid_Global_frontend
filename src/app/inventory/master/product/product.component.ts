import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import {
  Product,
  ProductReqDto,
  ProductService,
  ProductType
} from 'src/app/core/services/product/product.service';
import { Unit, UnitService } from 'src/app/core/services/unit/unit.service';

enum ModalType {
  VIEW = 'productModal',
  FORM = 'productFormModal'
}

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent extends BaseCrudComponent<Product, ProductReqDto> implements OnInit {
  entityName = 'Product';
  entityNameLower = 'product';
  isEditMode = false;

  units: Unit[] = [];

  productTypes = this.productService.getProductTypes();

  columns: TableColumn<Product>[] = [
    { key: 'id', label: 'SL', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'productType', label: 'Type', visible: true },
    { key: 'description', label: 'Description', visible: false },
    { key: 'unitName', label: 'Unit', visible: true },
    { key: 'pricePerUnit', label: 'Price', visible: true },
    { key: 'sortingOrder', label: 'Sort Order', visible: false },
    { key: 'active', label: 'Status', visible: true }
  ];

  get products(): Product[] {
    return this.items;
  }

  get selectedProduct(): Product | null {
    return this.selectedItem;
  }

  set selectedProduct(value: Product | null) {
    this.selectedItem = value;
  }

  get filteredProducts(): Product[] {
    return this.items;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Product' : 'Add New Product';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Add Product';
  }

  constructor(
    public service: ProductService,
    private productService: ProductService,
    private unitService: UnitService,
    public pageHeaderService: PageHeaderService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Product List');
    this.loadUnits();
    this.loadItems();
  }

  createNew(): Product {
    return {
      id: 0,
      name: '',
      productType: ProductType.RAW_MATERIAL,
      description: '',
      unitId: 0,
      sortingOrder: 0,
      pricePerUnit: 0,
      active: true
    };
  }

  isValid(product: Product | null): boolean {
    if (!product) return false;
    return !!(
      product.name?.trim() &&
      product.productType &&
      product.unitId &&
      product.unitId > 0
    );
  }

  mapToDto(product: Product): ProductReqDto {
    return {
      name: product.name,
      productType: product.productType,
      description: product.description,
      unitId: product.unitId,
      sortingOrder: product.sortingOrder,
      pricePerUnit: product.pricePerUnit
    };
  }

  loadUnits(): void {
    this.unitService.getAllActive(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.units = response.data;
          }
        },
        error: (error) => {
          console.error('Failed to load units:', error);
          this.errorMessage = 'Failed to load units';
        }
      });
  }

  getUnitName(unitId: number): string {
    const unit = this.units.find(u => u.id === unitId);
    return unit ? `${unit.name} - ${unit.fullName}` : 'Unknown';
  }

  getProductTypeDisplay(type: ProductType): string {
    return this.productService.getProductTypeDisplay(type);
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedProduct = this.createNew();
  }

  editProduct(product: Product): void {
    this.isEditMode = true;
    this.editItem(product);
  }

  viewProduct(product: Product): void {
    this.viewItem(product);
  }

  saveProduct(): void {
    if (!this.isValid(this.selectedProduct)) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const dto = this.mapToDto(this.selectedProduct!);
    this.isLoading = true;

    const operation = this.isEditMode && this.selectedProduct?.id
      ? this.service.update(this.selectedProduct.id, dto)
      : this.service.create(dto);

    operation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            const message = this.isEditMode
              ? 'Product updated successfully'
              : 'Product added successfully';
            this.handleCrudSuccess(message, ModalType.FORM);
          }
        },
        error: (error) => {
          const message = this.isEditMode
            ? 'Failed to update product'
            : 'Failed to add product';
          this.handleError(message, error);
        }
      });
  }


  loadProducts(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }


openDeleteModal(product: Product) {
  this.selectedProduct = product;
  const modal = new (window as any).bootstrap.Modal(
    document.getElementById('confirmDeleteModal')
  );
  modal.show();
}

confirmDelete() {
  if (this.selectedProduct) {
    this.deleteItem(this.selectedProduct, this.selectedProduct.name);
  }
}

// confirmDelete() {
//   if (this.selectedProduct && this.selectedProduct.id) {
//     const productId = this.selectedProduct.id;
//     const productName = this.selectedProduct.name;


//     const modalElement = document.getElementById('confirmDeleteModal');
//     const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
//     if (modal) {
//       modal.hide();
//     }

//     this.isLoading = true;

//     this.service.remove(productId)
//       .pipe(
//         takeUntil(this.destroy$),
//         finalize(() => this.isLoading = false)
//       )
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.handleCrudSuccess(`Product "${productName}" deleted successfully`);
//             this.items = this.items.filter(item => item.id !== productId);
//           }
//         },
//         error: (error) => {
//           this.handleError(`Failed to delete product "${productName}"`, error);
//         }
//       });
//   }
// }
}