import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Income, IncomeReqDto, IncomeService } from 'src/app/core/services/income/income.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { TransectionCategory, TransectionCategoryService } from 'src/app/core/services/transectionCategory/transection-category.service';

enum ModalType {
  VIEW = 'incomeModal',
  FORM = 'incomeFormModal',
  DELETE = 'confirmDeleteModal',
  CANCEL = 'cancelReasonModal'
}

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.css']
})
export class IncomeComponent extends simpleCrudComponent<Income, IncomeReqDto> implements OnInit {
  entityName = 'Income';
  entityNameLower = 'income';
  paymentMethod: PaymentMethod[] = [];
  incomeCategory: TransectionCategory[] = [];
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  submitted = false;

  columns: TableColumn<Income>[] = [
    { key: 'incomeId', label: 'Income ID', visible: true },
    { key: 'categoryName', label: 'Income Type', visible: true },
    { key: 'incomeDate', label: 'Date', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'paymentMethodName', label: 'Payment Method', visible: false },
    { key: 'paidFrom', label: 'Paid From', visible: true },
    { key: 'approvedByName', label: 'Approved By', visible: true },
    { key: 'status', label: 'Status', visible: true }
  ];

  get incomes(): Income[] {
    return this.items;
  }

  get selectedIncome(): Income | null {
    return this.selectedItem;
  }

  set selectedIncome(value: Income | null) {
    this.selectedItem = value;
  }

  get filteredIncomes(): Income[] {
    return this.items;
  }

  constructor(
    public service: IncomeService,
    public pageHeaderService: PageHeaderService,
    public paymentMethodService: PaymentMethodService,
    public transectionCategoryService: TransectionCategoryService,
    public authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Income List');
    this.loadItems();
    this.loadPaymentMethods();
    this.loadTransectionCategory();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  createNew(): Income {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 0,
      incomeId: '',
      categoryId: 0,
      categoryName: '',
      paymentMethodId: 0,
      paymentMethodName: '',
      amount: 0,
      paidFrom: '',
      paidFromCompany: '',
      incomeDate: today,
      description: '',
      approvedByName: '',
      approvalDate: '',
      cancelReason: '',
      status: 'PENDING',
      createdBy: 0,
      createdByName: ''
    };
  }

  mapToDto(income: Income): IncomeReqDto {
    const dto: any = {};

    // Only add fields that have valid values
    if (income.categoryId && income.categoryId !== 0) {
      dto.incomeCategory = income.categoryId;
    }

    if (income.incomeDate) {
      dto.incomeDate = income.incomeDate;
    }

    if (income.amount && income.amount !== 0) {
      dto.amount = income.amount;
    }

    if (income.paymentMethodId && income.paymentMethodId !== 0) {
      dto.paymentMethodId = income.paymentMethodId;
    }

    if (income.paidFrom && income.paidFrom.trim() !== '') {
      dto.paidFrom = income.paidFrom.trim();
    }

    if (income.paidFromCompany && income.paidFromCompany.trim() !== '') {
      dto.paidFromCompany = income.paidFromCompany.trim();
    }

    if (income.description && income.description.trim() !== '') {
      dto.description = income.description.trim();
    }

    // Only add status and approvalDate if in edit mode
    if (this.isEditMode) {
      if (income.status) {
        dto.status = income.status;
      }
      if (income.approvalDate) {
        dto.approvalDate = income.approvalDate;
      }
    }

    return dto;
  }

  openAddModal(): void {
    this.selectedIncome = this.createNew();
    this.isEditMode = false;
    this.validationErrors = {};
    this.errorMessage = '';
    console.log('Opening add modal, validation errors cleared:', this.validationErrors);
  }

  viewIncome(income: Income): void {
    this.viewItem(income);
  }

  editIncome(income: Income): void {
    this.selectedIncome = {
      ...income,
      categoryId: Number(income.categoryId),
      paymentMethodId: Number(income.paymentMethodId)
    };
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = '';
    console.log('Opening edit modal, validation errors cleared:', this.validationErrors);
  }

  addIncome(): void {
    const dto = this.mapToDto(this.selectedIncome!);

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
            this.handleCrudSuccess('Income added successfully', ModalType.FORM);
            this.validationErrors = {};
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
            this.handleError('Failed to add income', error);
          }
        }
      });
  }

  saveIncomeForm(): void {
    this.submitted = true;

    if (!this.paidFromValid) {
      return;
    }

    if (this.isEditMode) {
      this.saveIncome();
    } else {
      this.addIncome();
    }
  }

  saveIncome(): void {
    if (!this.selectedIncome?.id) {
      this.errorMessage = 'Invalid income data';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const dto = this.mapToDto(this.selectedIncome);
    console.log('Updating DTO:', dto);

    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedIncome.id, dto)
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
            this.handleCrudSuccess('Income updated successfully', ModalType.FORM);
            this.validationErrors = {};
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
            this.handleError('Failed to update income', error);
          }
        }
      });
  }

  openDeleteModal(income: Income): void {
    this.selectedIncome = income;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedIncome) {
      this.deleteItem(this.selectedIncome, this.selectedIncome.incomeId);
    }
  }

  approveIncome(income: Income): void {
    if (income.status === 'APPROVED') {
      this.errorMessage = 'Income is already approved';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (confirm(`Are you sure you want to approve income ${income.incomeId}?`)) {
      this.isLoading = true;
      this.service.approveIncome(income.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadItems();
              console.log('Income approved successfully');
            } else {
              this.errorMessage = response.message || 'Failed to approve income';
              setTimeout(() => this.clearError(), 3000);
            }
          },
          error: (error: any) => this.handleError('Failed to approve income', error)
        });
    }
  }

  openCancelModal(income: Income): void {
    this.selectedIncome = { ...income, cancelReason: '' };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  submitCancelReason(): void {
    if (!this.selectedIncome || !this.selectedIncome.cancelReason?.trim()) {
      this.errorMessage = 'Please provide a cancellation reason';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    this.isLoading = true;
    this.service.cancelIncome(this.selectedIncome.id, this.selectedIncome.cancelReason.trim())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadItems();
            console.log('Income cancelled successfully');
            this.closeModal(ModalType.CANCEL);
          } else {
            this.errorMessage = response.message || 'Failed to cancel income';
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => {
          this.handleError('Failed to cancel income', error);
        }
      });
  }

  loadIncomes(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllActive(true, 0, 100).subscribe({
      next: (res) => {
        this.paymentMethod = res.data.data.map(method => ({
          ...method,
          id: Number(method.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load payment methods', err);
      }
    });
  }

  loadTransectionCategory(): void {
    this.transectionCategoryService.getAllActive(true, "INCOME", 0, 100).subscribe({
      next: (res) => {
        this.incomeCategory = res.data.map(cat => ({
          ...cat,
          id: Number(cat.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load income categories', err);
      }
    });
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }

  get paidFromValid(): boolean {
    if (!this.selectedIncome) return false;
    return !!this.selectedIncome.paidFrom?.trim();
  }
}