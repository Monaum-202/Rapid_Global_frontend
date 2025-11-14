import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { PaymentMethod, PaymentMethodReqDto, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';

enum ModalType {
  VIEW = 'paymentMethodModal',
  ADD = 'paymentMethodAddModal',
  EDIT = 'paymentMethodEditModal'
}

@Component({
  selector: 'app-payment-method',
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.css']
})
export class PaymentMethodComponent extends BaseCrudComponent<PaymentMethod, PaymentMethodReqDto> implements OnInit {
  entityName = 'PaymentMethod';
  entityNameLower = 'paymentMethod';

  columns: TableColumn<PaymentMethod>[] = [
    { key: 'id', label: 'SL', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'description', label: 'Description', visible: true },
    { key: 'active', label: 'Active', visible: true }
  ];

  // Expose items with proper naming for template
  get paymentMethods(): PaymentMethod[] {
    return this.items;
  }

  get selectedPaymentMethod(): PaymentMethod | null {
    return this.selectedItem;
  }

  set selectedPaymentMethod(value: PaymentMethod | null) {
    this.selectedItem = value;
  }

  get filteredPaymentMethods(): PaymentMethod[] {
    return this.items;
  }

  constructor(
    public service: PaymentMethodService,
    public pageHeaderService: PageHeaderService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Payment Method List');
    this.loadItems();
  }

  // ==================== Component-Specific Methods ====================

  createNew(): PaymentMethod {
    return {
      id: 0,
      name: '',
      description: '',
      active: true,
      sqn: 0
    };
  }

  isValid(paymentMethod: PaymentMethod | null): boolean {
    if (!paymentMethod) return false;
    return !!(paymentMethod.name && paymentMethod.description && paymentMethod.sqn);
  }

  mapToDto(paymentMethod: PaymentMethod): PaymentMethodReqDto {
    return {
      name: paymentMethod.name,
      description: paymentMethod.description,
      sqn: paymentMethod.sqn
    };
  }

  // ==================== Template-Friendly Method Names ====================

  openAddModal(): void {
    this.selectedPaymentMethod = this.createNew();
  }

  viewPaymentMethod(paymentMethod: PaymentMethod): void {
    this.viewItem(paymentMethod);
  }

  editPaymentMethod(paymentMethod: PaymentMethod): void {
    this.editItem(paymentMethod);
  }

  addPaymentMethod(): void {
    if (!this.isValid(this.selectedPaymentMethod)) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const dto = this.mapToDto(this.selectedPaymentMethod!);

    this.isLoading = true;
    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleCrudSuccess('PaymentMethod added successfully', ModalType.ADD);
          }
        },
        error: (error) => this.handleError('Failed to add paymentMethod', error)
      });
  }

  savePaymentMethod(): void {
    if (!this.isValid(this.selectedPaymentMethod) || !this.selectedPaymentMethod?.id) {
      this.errorMessage = 'Invalid paymentMethod data';
      return;
    }

    const dto = this.mapToDto(this.selectedPaymentMethod);

    this.isLoading = true;
    this.service.update(this.selectedPaymentMethod.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleCrudSuccess('PaymentMethod updated successfully', ModalType.EDIT);
          }
        },
        error: (error) => this.handleError('Failed to update paymentMethod', error)
      });
  }

  deletePaymentMethod(paymentMethod: PaymentMethod): void {
    this.deleteItem(paymentMethod, paymentMethod.name);
  }

  loadPaymentMethods(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  openDeleteModal(paymentMethod: PaymentMethod) {
  this.selectedPaymentMethod = paymentMethod;

  const modal = new (window as any).bootstrap.Modal(
    document.getElementById('confirmDeleteModal')
  );
  modal.show();
}

confirmDelete() {
  if (this.selectedPaymentMethod) {
    this.deleteItem(this.selectedPaymentMethod, this.selectedPaymentMethod.name);
  }
}

}