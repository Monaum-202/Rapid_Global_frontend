import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Employee, EmployeeService } from 'src/app/core/services/employee/employee.service';
import { Expense, ExpenseReqDto, ExpenseService } from 'src/app/core/services/expense/expense.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { TransectionCategory, TransectionCategoryService } from 'src/app/core/services/transectionCategory/transection-category.service';

enum ModalType {
  VIEW = 'expenseModal',
  FORM = 'expenseFormModal',
  DELETE = 'confirmDeleteModal',
  CANCEL = 'cancelReasonModal'
}

@Component({
  selector: 'app-expense',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent extends simpleCrudComponent<Expense, ExpenseReqDto> implements OnInit {
  entityName = 'Expense';
  entityNameLower = 'expense';
  paymentMethod: PaymentMethod[] = [];
  expenseCategory: TransectionCategory[] = [];
  employee: Employee[] = [];
  isEditMode = false;
  validationErrors: { [key: string]: string[] } = {};
  roleId = 0;
  userId = 0;
  submitted = false;

  columns: TableColumn<Expense>[] = [
    { key: 'expenseId', label: 'EXP ID', visible: true },
    { key: 'categoryName', label: 'Expense Type', visible: true },
    { key: 'date', label: 'Date', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'paymentMethodName', label: 'Payment Method', visible: false },
    { key: 'paidTo', label: 'Paid To', visible: true },
    { key: 'approvedByName', label: 'Approved By', visible: true },
    { key: 'status', label: 'Status', visible: true }
  ];

  get expenses(): Expense[] {
    return this.items;
  }

  get selectedExpense(): Expense | null {
    return this.selectedItem;
  }

  set selectedExpense(value: Expense | null) {
    this.selectedItem = value;
  }

  get filteredExpenses(): Expense[] {
    return this.items;
  }

  constructor(
    public service: ExpenseService,
    public pageHeaderService: PageHeaderService,
    public paymentMethodService: PaymentMethodService,
    public transectionCategoryService: TransectionCategoryService,
    public employeeService: EmployeeService,
    public authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Expense List');
    this.loadItems();
    this.loadPaymentMethods();
    this.loadTransectionCategory();
    this.loadEmployees();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
    const id2 = this.authService.getUserId();
    this.userId = id2 ?? 0;
  }

  createNew(): Expense {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 0,
      expenseId: '',
      categoryId: 0,
      categoryName: '',
      paymentMethodId: 0,
      paymentMethodName: '',
      transactionId: '',
      employeeId: 0,
      employeeName: '',
      amount: 0,
      paidTo: '',
      paidToCompany: '',
      date: today,
      description: '',
      approvedByName: '',
      approvalDate: '',
      cancelReason: '',
      status: 'PENDING',
      createdBy: 0,
      createdByName: ''
    };
  }

  mapToDto(expense: Expense): ExpenseReqDto {
    const dto: any = {};

    // Only add fields that have valid values
    if (expense.categoryId && expense.categoryId !== 0) {
      dto.expenseCategory = expense.categoryId;
    }

    if (expense.date) {
      dto.expenseDate = expense.date;
    }

    if (expense.amount && expense.amount !== 0) {
      dto.amount = expense.amount;
    }

    if (expense.paymentMethodId && expense.paymentMethodId !== 0) {
      dto.paymentMethodId = expense.paymentMethodId;
    }

    if (expense.transactionId && expense.transactionId.trim() !== '') {
      dto.addTransectionId = expense.transactionId.trim();
    }

    if (expense.employeeId && expense.employeeId !== 0) {
      dto.employeeId = expense.employeeId;
    }

    if (expense.paidTo && expense.paidTo.trim() !== '') {
      dto.paidTo = expense.paidTo.trim();
    }

    if (expense.paidToCompany && expense.paidToCompany.trim() !== '') {
      dto.paidToCompany = expense.paidToCompany.trim();
    }

    if (expense.description && expense.description.trim() !== '') {
      dto.description = expense.description.trim();
    }

    // Only add status and approvalDate if in edit mode
    if (this.isEditMode) {
      if (expense.status) {
        dto.status = expense.status;
      }
      if (expense.approvalDate) {
        dto.approvalDate = expense.approvalDate;
      }
    }

    return dto;
  }

  openAddModal(): void {
    this.selectedExpense = this.createNew();
    this.isEditMode = false;
    this.validationErrors = {};
    this.errorMessage = ''; // Clear any previous error messages
    console.log('Opening add modal, validation errors cleared:', this.validationErrors);
  }

  viewExpense(expense: Expense): void {
    this.viewItem(expense);
  }

  editExpense(expense: Expense): void {
    this.selectedExpense = {
      ...expense,
      categoryId: Number(expense.categoryId),
      paymentMethodId: Number(expense.paymentMethodId),
      employeeId: expense.employeeId ? Number(expense.employeeId) : 0
    };
    this.isEditMode = true;
    this.validationErrors = {};
    this.errorMessage = ''; // Clear any previous error messages
    console.log('Opening edit modal, validation errors cleared:', this.validationErrors);
  }

  addExpense(): void {
    const dto = this.mapToDto(this.selectedExpense!);

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

          // Check if response indicates validation failure
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else if (response.success) {
            this.handleCrudSuccess('Expense added successfully', ModalType.FORM);
            this.validationErrors = {};
          }
        },
        error: (error: any) => {
          console.log('Error response:', error);
          console.log('Error body:', error.error);

          // Handle backend validation errors from error response
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else {
            this.handleError('Failed to add expense', error);
          }
        }
      });
  }

  saveExpenseForm(): void {
    this.submitted = true;

    if (!this.employeeOrPaidToValid) {
    return;
  }
    if (this.isEditMode) {
      this.saveExpense();
    } else {
      this.addExpense();
    }
  }

  saveExpense(): void {
    if (!this.selectedExpense?.id) {
      this.errorMessage = 'Invalid expense data';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const dto = this.mapToDto(this.selectedExpense);
    console.log('Updating DTO:', dto);

    this.isLoading = true;
    this.validationErrors = {};
    this.errorMessage = '';

    this.service.update(this.selectedExpense.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Success response:', response);

          // Check if response indicates validation failure
          if (response.success === false && response.errors) {
            this.validationErrors = response.errors;
            this.errorMessage = response.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else if (response.success) {
            this.handleCrudSuccess('Expense updated successfully', ModalType.FORM);
            this.validationErrors = {};
          }
        },
        error: (error: any) => {
          console.log('Error response:', error);
          console.log('Error body:', error.error);

          // Handle backend validation errors from error response
          if (error.status === 400 && error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Validation Failed';
            console.log('Validation errors set:', this.validationErrors);
            console.log('Error message set:', this.errorMessage);
          } else {
            this.handleError('Failed to update expense', error);
          }
        }
      });
  }

  openDeleteModal(expense: Expense): void {
    this.selectedExpense = expense;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedExpense) {
      this.deleteItem(this.selectedExpense, this.selectedExpense.expenseId);
    }
  }

  approveExpense(expense: Expense): void {
    if (expense.status === 'APPROVED') {
      this.errorMessage = 'Expense is already approved';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (confirm(`Are you sure you want to approve expense ${expense.expenseId}?`)) {
      this.isLoading = true;
      this.service.approveExpense(expense.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadItems();
              console.log('Expense approved successfully');
            } else {
              this.errorMessage = response.message || 'Failed to approve expense';
              setTimeout(() => this.clearError(), 3000);
            }
          },
          error: (error: any) => this.handleError('Failed to approve expense', error)
        });
    }
  }

  openCencelModal(expense: Expense): void {
    this.selectedExpense = { ...expense, cancelReason: '' };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  submitCancelReason(): void {
    if (!this.selectedExpense || !this.selectedExpense.cancelReason?.trim()) {
      this.errorMessage = 'Please provide a cancellation reason';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    this.isLoading = true;
    this.service.cancelExpense(this.selectedExpense.id, this.selectedExpense.cancelReason.trim())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadItems();
            console.log('Expense cancelled successfully');
            this.closeModal(ModalType.CANCEL);
          } else {
            this.errorMessage = response.message || 'Failed to cancel expense';
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => {
          this.handleError('Failed to cancel expense', error);
        }
      });
  }

  loadExpenses(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
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

  loadEmployees(): void {
    this.employeeService.getAllActive(true).subscribe({
      next: (res) => {
        this.employee = res.data.map(emp => ({
          ...emp,
          id: Number(emp.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load employees', err);
      }
    });
  }

  loadTransectionCategory(): void {
    this.transectionCategoryService.getAllActive(true, "EXPENSE").subscribe({
      next: (res) => {
        this.expenseCategory = res.data.map(cat => ({
          ...cat,
          id: Number(cat.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load expense categories', err);
      }
    });
  }

  // Helper method for template to check if validation errors exist
  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  // Helper method to get validation error keys
  getValidationErrorKeys(): string[] {
    return Object.keys(this.validationErrors);
  }

  get employeeOrPaidToValid(): boolean {
  if (!this.selectedExpense) return false;
  return !!this.selectedExpense.employeeId || !!this.selectedExpense.paidTo?.trim();
}

}