import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { Employee, EmployeeService } from 'src/app/core/services/employee/employee.service';
import { Expense, ExpenseReqDto, ExpenseService } from 'src/app/core/services/expense/expense.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';
import { TransectionCategory, TransectionCategoryService } from 'src/app/core/services/transectionCategory/transection-category.service';


enum ModalType {
  VIEW = 'expenseViewModal',
  ADD = 'expenseAddModal',
  EDIT = 'expenseEditModal'
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
  employee:Employee[] = [];

  columns: TableColumn<Expense>[] = [
    { key: 'expenseId', label: 'EXP ID', visible: true },
    { key: 'categoryName', label: 'Expense Type', visible: true },
    { key: 'expenseDate', label: 'Date', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'paymentMethodName', label: 'Payment Method', visible: false},
    { key: 'paidTo', label: 'Paid To', visible: true },
    { key: 'approvedBy', label: 'Approved By', visible: true },
    { key: 'status', label: 'Status', visible: true }
  ];

  // Expose items with proper naming for template
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
    public employeeService: EmployeeService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Expense List');
    this.loadItems();
    this.loadPaymentMethods();
    this.loadTransectionCategory();
    this.loadEmployees();
  }

  // ==================== Component-Specific Methods ====================

  createNew(): Expense {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 0,
      expenseId:'',
      categoryId: 0,
      categoryName: '',
      paymentMethodId: 0,
      paymentMethodName: '',
      employeeId: 0,
      employeeName: '',
      amount: 0,
      paidTo: '',
      expenseDate: '',
      description: '',
      approvedBy: '',
      approvalDate: '',
      status: '',
    };

  }

  isValid(expense: Expense | null): boolean {
    if (!expense) return false;
    return !!(
      expense.categoryId &&
      expense.expenseDate &&
      expense.amount > 0 &&
      expense.paymentMethodId
    );
  }

  mapToDto(expense: Expense): ExpenseReqDto {
    return {
      expenseCategory: expense.categoryId,
      expenseDate: expense.expenseDate,
      amount: expense.amount,
      paymentMethodId: expense.paymentMethodId,
      employeeId: expense.employeeId,
      paidTo: expense.paidTo,
      status: expense.status,
      approvedBy: expense.approvedBy,
      approvalDate: expense.approvalDate,
      description: expense.description,
      // attachment: expense.attachment
    };
  }

  // ==================== Template-Friendly Method Names ====================

  openAddModal(): void {
    this.selectedExpense = this.createNew();
  }

  viewExpense(expense: Expense): void {
    this.viewItem(expense);
  }

  editExpense(expense: Expense): void {
    this.editItem(expense);
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
            this.handleCrudSuccess('Expense added successfully', ModalType.ADD);
          }
        },
        error: (error: any) => this.handleError('Failed to add expense', error)
      });
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
            this.handleCrudSuccess('Expense updated successfully', ModalType.EDIT);
          }
        },
        error: (error: any) => this.handleError('Failed to update expense', error)
      });
  }

  deleteExpense(expense: Expense): void {
    const displayName = `${expense.categoryName} - $${expense.amount}`;
    this.deleteItem(expense, displayName);
  }

  approveExpense(expense: Expense): void {
    if (expense.status === 'Approved') {
      this.errorMessage = 'Expense is already approved';
      return;
    }

    // Create a copy of the expense with approved status
    const approvedExpense: Expense = {
      ...expense,
      status: 'Approved',
      approvalDate: new Date().toISOString().split('T')[0]
    };

    const dto = this.mapToDto(approvedExpense);

    this.isLoading = true;
    this.service.update(expense.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadItems();
            // Show success message (you can use a toast service here)
            console.log('Expense approved successfully');
          }
        },
        error: (error: any) => this.handleError('Failed to approve expense', error)
      });
  }

  loadExpenses(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllActive(true, 0, 100).subscribe({
      next: (res) => {
        this.paymentMethod = res.data.data; // adjust if your response structure is different
      },
      error: (err) => {
        console.error('Failed to load payment methods', err);
      }
    });
  }

  loadEmployees(): void{
    this.employeeService.getAllActive(true,0,100).subscribe({
      next: (res) => {
        this.employee = res.data.data;
      },
      error: (err) => {
        console.error('Failed to load employees', err)
      }
    })
  }

  loadTransectionCategory(): void {
    this.transectionCategoryService.getAllActive(true, "EXPENSE", 0, 100).subscribe({
      next: (res) => {
        this.expenseCategory = res.data.data;
      },
      error: (err) => {
        console.error('Failed to load payment methods', err);
      }
    });
  }


}