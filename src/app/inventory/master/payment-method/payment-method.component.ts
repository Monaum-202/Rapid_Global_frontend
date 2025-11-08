import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { BackendPaginator } from 'src/app/core/models/backend-paginator';
import { PaymentMethod, PaymentMethodService } from 'src/app/core/services/paymentMethod/payment-method.service';

interface TableColumn {
  key: keyof PaymentMethod;
  label: string;
  visible: boolean;
}

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
export class PaymentMethodComponent {

    employees: PaymentMethod[] = [];
    selectedEmployee: PaymentMethod | null = null;

    isLoading = false;
    errorMessage = '';
    searchTerm = '';
    showColumnDropdown = false;

      columns: TableColumn[] = [
        { key: 'id', label: 'ID', visible: true },
        { key: 'name', label: 'Name', visible: true },
        { key: 'description', label: 'Description', visible: true },
        { key: 'status', label: 'Status', visible: true }
      ];

      paginator = new BackendPaginator(10);
      readonly PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

      private destroy$ = new Subject<void>();

      constructor(private paymentMethodService: PaymentMethodService) { }

      ngOnInit(): void {
        this.loadEmployees();
      }

      ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
      }

      // ==================== Data Loading ====================

      loadEmployees(): void {
        this.isLoading = true;
        this.clearError();

        const request$ = this.employeeService.getAll(this.paginator.currentPage, this.paginator.pageSize);

        request$
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.employees = response.data.data || [];
                this.paginator.updateFromResponse(response.data);
              }
            },
            error: (error) => this.handleError('Failed to load employees', error)
          });
      }

      // ==================== Search & Filter ====================

      onSearchChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchTerm = input.value.trim().toLowerCase();
        // Note: For true backend search, you'd need to modify the backend API
        // This is a client-side filter on the current page
      }

      get filteredEmployees(): Employee[] {
        if (!this.searchTerm) {
          return this.employees;
        }

        return this.employees.filter(emp =>
          emp.id?.toString().includes(this.searchTerm) ||
          emp.name?.toLowerCase().includes(this.searchTerm) ||
          emp.phone?.toLowerCase().includes(this.searchTerm) ||
          emp.email?.toLowerCase().includes(this.searchTerm)
        );
      }


      // ==================== Column Management ====================

      toggleColumnDropdown(): void {
        this.showColumnDropdown = !this.showColumnDropdown;
      }

      isColumnVisible(key: string): boolean {
        return this.columns.find(c => c.key === key)?.visible ?? false;
      }

      toggleColumnVisibility(column: TableColumn): void {
        column.visible = !column.visible;
      }

      get visibleColumnsCount(): number {
        return this.columns.filter(c => c.visible).length + 1; // +1 for actions
      }

      get visibleColumns(): TableColumn[] {
        return this.columns.filter(c => c.visible);
      }

      // ==================== Pagination ====================

      onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.paginator.pageSize = Number(select.value);
        this.paginator.goToPage(0);
        this.loadEmployees();
      }

      goToPage(page: number): void {
        this.paginator.goToPage(page);
        this.loadEmployees();
      }

      nextPage(): void {
        this.paginator.nextPage();
        this.loadEmployees();
      }

      previousPage(): void {
        this.paginator.previousPage();
        this.loadEmployees();
      }

      get canGoPrevious(): boolean {
        return this.paginator.currentPage > 0;
      }

      get canGoNext(): boolean {
        return this.paginator.currentPage < this.paginator.totalPages - 1;
      }

      getPageNumbers(): number[] {
        return this.paginator.getPageNumbers();
      }

      // ==================== CRUD Operations ====================

      viewEmployee(employee: Employee): void {
        this.selectedEmployee = { ...employee };
      }

      openAddModal(): void {
        this.selectedEmployee = this.createNewEmployee();
      }

      private createNewEmployee(): Employee {
        const maxSqn = this.employees.reduce((max, emp) => Math.max(max, emp.sqn || 0), 0);

        return {
          id: 0,
          name: '',
          email: '',
          phone: '',
          salary: 0,
          joiningDate: this.getTodayDate(),
          sqn: maxSqn + 1,
          status: true
        };
      }

      private getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
      }

      editEmployee(employee: Employee): void {
        this.selectedEmployee = { ...employee };
      }

      addEmployee(): void {
        if (!this.isValidEmployee(this.selectedEmployee)) {
          this.errorMessage = 'Please fill in all required fields';
          return;
        }

        const dto = this.mapToDto(this.selectedEmployee!);

        this.isLoading = true;
        this.employeeService.create(dto)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: (response) => {
              if (response.success) this.handleCrudSuccess('Employee added successfully', ModalType.ADD);
            },
            error: (error) => this.handleError('Failed to add employee', error)
          });
      }

      saveEmployee(): void {
        if (!this.isValidEmployee(this.selectedEmployee) || !this.selectedEmployee?.id) {
          this.errorMessage = 'Invalid employee data';
          return;
        }

        const dto = this.mapToDto(this.selectedEmployee);

        this.isLoading = true;
        this.employeeService.update(this.selectedEmployee.id, dto)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: (response) => {
              if (response.success) this.handleCrudSuccess('Employee updated successfully', ModalType.EDIT);
            },
            error: (error) => this.handleError('Failed to update employee', error)
          });
      }

      toggleStatus(employee: Employee): void {
        if (!employee.id) return;

        this.employeeService.statusUpdate(employee.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success) {
                employee.status = !employee.status;
              }
            },
            error: (error) => this.handleError('Failed to update status', error)
          });
      }

      deleteEmployee(employee: Employee): void {
        if (!employee.id) return;

        const confirmed = confirm(`Are you sure you want to delete ${employee.name}?`);
        if (!confirmed) return;

        this.isLoading = true;
        this.employeeService.deleteEmployee(employee.id)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: (response) => {
              if (response.success) this.handleCrudSuccess('Employee deleted successfully');
            },
            error: (error) => this.handleError('Failed to delete employee', error)
          });
      }

      // ==================== Helpers ====================

      private handleCrudSuccess(message: string, modalId?: ModalType): void {
        this.loadEmployees();
        if (modalId) this.closeModal(modalId);
        console.log(message);
      }

      private handleError(message: string, error: any): void {
        console.error(message, error);
        this.errorMessage = error?.error?.message || message;
      }

      private closeModal(modalId: string): void {
        const element = document.getElementById(modalId);
        if (!element) return;
        const modal = (window as any).bootstrap?.Modal.getInstance(element);
        modal?.hide();
      }

      clearError(): void {
        this.errorMessage = '';
      }

      private isValidEmployee(employee: Employee | null): boolean {
        if (!employee) return false;
        return !!(employee.name && employee.phone && employee.salary && employee.joiningDate);
      }

      private mapToDto(employee: PaymentMethod): EmployeeReqDto {
        return {
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          salary: employee.salary,
          joiningDate: employee.joiningDate,
          sqn: employee.sqn
        };
      }

      formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      getStatusClass(status: boolean): string {
        return status ? 'badge bg-success' : 'badge bg-danger';
      }

      getStatusText(status: boolean): string {
        return status ? 'Active' : 'Inactive';
      }
}
