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
  roleId = 0;
  userId = 0 ;

  columns: TableColumn<Expense>[] = [
    { key: 'expenseId', label: 'EXP ID', visible: true },
    { key: 'categoryName', label: 'Expense Type', visible: true },
    { key: 'date', label: 'Date', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'paymentMethodName', label: 'Payment Method', visible: false },
    { key: 'paidTo', label: 'Paid To', visible: true },
    { key: 'approvedBy', label: 'Approved By', visible: true },
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
      employeeId: 0,
      employeeName: '',
      amount: 0,
      paidTo: '',
      date: today,
      description: '',
      approvedBy: '',
      approvalDate: '',
      cancelReason: '',
      status: 'PENDING',
      createdBy:0
    };
  }

  isValid(expense: Expense | null): boolean {
    if (!expense) return false;
    return !!(
      expense.categoryId &&
      expense.date &&
      expense.amount > 0 &&
      expense.paymentMethodId
    );
  }

  mapToDto(expense: Expense): ExpenseReqDto {
    return {
      expenseCategory: expense.categoryId,
      expenseDate: expense.date,
      amount: expense.amount,
      paymentMethodId: expense.paymentMethodId,
      employeeId: expense.employeeId || undefined,
      paidTo: expense.paidTo,
      status: expense.status,
      approvedBy: expense.approvedBy,
      approvalDate: expense.approvalDate,
      description: expense.description,

    };
  }

  openAddModal(): void {
    this.selectedExpense = this.createNew();
    this.isEditMode = false;
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
  }

  addExpense(): void {
    if (!this.isValid(this.selectedExpense)) {
      this.errorMessage = 'Please fill in all required fields (Category, Date, Amount, Payment Method)';
      return;
    }

    const dto = this.mapToDto(this.selectedExpense!);

    this.isLoading = true;
    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.handleCrudSuccess('Expense added successfully', ModalType.FORM);
          }
        },
        error: (error: any) => this.handleError('Failed to add expense', error)
      });
  }

  saveExpenseForm(): void {
    if (this.isEditMode) {
      this.saveExpense();
    } else {
      this.addExpense();
    }
  }

  saveExpense(): void {
    if (!this.isValid(this.selectedExpense) || !this.selectedExpense?.id) {
      this.errorMessage = 'Invalid expense data';
      return;
    }

    const dto = this.mapToDto(this.selectedExpense);

    this.isLoading = true;
    this.service.update(this.selectedExpense.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.handleCrudSuccess('Expense updated successfully', ModalType.FORM);
          }
        },
        error: (error: any) => this.handleError('Failed to update expense', error)
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

  /**
   * Approve expense using dedicated backend endpoint
   */
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

  /**
   * Open cancel reason modal
   */
  openCencelModal(expense: Expense): void {
    this.selectedExpense = { ...expense, cancelReason: '' };
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.CANCEL)
    );
    modal.show();
  }

  /**
   * Submit cancel reason
   */
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
            // Close the modal
            this.closeModal(ModalType.CANCEL);
          } else {
            this.errorMessage = response.message || 'Failed to cancel expense';
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => {
          this.handleError('Failed to cancel expense', error);
          // Keep modal open on error so user can retry
        }
      });
  }

  loadExpenses(isSearchOperation = false): void {
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

  loadEmployees(): void {
    this.employeeService.getAllActive(true, 0, 100).subscribe({
      next: (res) => {
        this.employee = res.data.data.map(emp => ({
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
    this.transectionCategoryService.getAllActive(true, "EXPENSE", 0, 100).subscribe({
      next: (res) => {
        this.expenseCategory = res.data.data.map(cat => ({
          ...cat,
          id: Number(cat.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load expense categories', err);
      }
    });
  }
}