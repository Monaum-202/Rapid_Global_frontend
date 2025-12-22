import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { Employee, EmployeeReqDto, EmployeeService, LendRecord } from 'src/app/core/services/employee/employee.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { ToastService } from 'src/app/core/services/feature/toast.service';

enum ModalType {
  VIEW = 'employeeModal',
  FORM = 'employeeFormModal'
}

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent extends BaseCrudComponent<Employee, EmployeeReqDto> implements OnInit {

  // Required abstract properties
  entityName = 'Employee';
  entityNameLower = 'employee';
  isEditMode = false;

  // Lend pagination properties
  lendCurrentPage = 1;
  lendPageSize = 10;
  isLoadingLends = false;

  columns: TableColumn<Employee>[] = [
    { key: 'employeeId', label: 'EMP ID', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'email', label: 'Email', visible: false },
    { key: 'salary', label: 'Salary', visible: false },
    { key: 'joiningDate', label: 'Joining Date', visible: false },
    { key: 'active', label: 'Active', visible: true }
  ];

  // Template-friendly getters/setters
  get employees(): Employee[] {
    return this.items;
  }

  get selectedEmployee(): Employee | null {
    return this.selectedItem;
  }

  set selectedEmployee(value: Employee | null) {
    this.selectedItem = value;
  }

  get filteredEmployees(): Employee[] {
    return this.items;
  }

  // Computed properties for modal
  get modalTitle(): string {
    return this.isEditMode ? 'Edit Employee' : 'Add New Employee';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Add Employee';
  }

  constructor(
    public service: EmployeeService,
    public pageHeaderService: PageHeaderService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Employee List');
    this.loadItems();
  }

  // Implement required abstract methods
  createNew(): Employee {
    const maxSqn = this.items.reduce((max, emp) => Math.max(max, emp.sqn || 0), 0);
    return {
      id: 0,
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      salary: 0,
      joiningDate: this.getTodayDate(),
      sqn: maxSqn + 1,
      active: true,
      totalLend: 0
    };
  }

  isValid(employee: Employee | null): boolean {
    if (!employee) {
      this.toastService.warning('Employee data is required');
      return false;
    }

    if (!employee.name || employee.name.trim().length < 2) {
      this.toastService.warning('Employee name is required (min 2 characters)');
      return false;
    }

    if (!employee.phone || employee.phone.trim().length < 11) {
      this.toastService.warning('Phone number must be at least 11 digits');
      return false;
    }

    if (!employee.salary || employee.salary < 0) {
      this.toastService.warning('Valid salary is required');
      return false;
    }

    if (!employee.joiningDate) {
      this.toastService.warning('Joining date is required');
      return false;
    }

    return true;
  }

  mapToDto(employee: Employee): EmployeeReqDto {
    return {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      salary: employee.salary,
      joiningDate: employee.joiningDate,
      sqn: employee.sqn
    };
  }

  // Template-friendly wrapper methods
  openAddModal(): void {
    this.isEditMode = false;
    this.selectedEmployee = this.createNew();
    this.clearError();
  }

  viewEmployee(employee: Employee): void {
    this.viewItem(employee);
  }

  editEmployee(employee: Employee): void {
    this.isEditMode = true;
    this.editItem(employee);
    this.clearError();
  }

  deleteEmployee(employee: Employee): void {
    this.deleteItem(employee, employee.name);
  }

  loadEmployees(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  // Combined save method
  saveEmployeeForm(): void {
    if (!this.isValid(this.selectedEmployee)) {
      return;
    }

    if (this.isEditMode) {
      this.saveEmployee();
    } else {
      this.addEmployee();
    }
  }

  addEmployee(): void {
    if (!this.isValid(this.selectedEmployee)) {
      return;
    }

    const dto = this.mapToDto(this.selectedEmployee!);

    this.isLoading = true;
    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || 'Employee added successfully');
            this.handleCrudSuccess('Employee added successfully', ModalType.FORM);
          } else {
            this.toastService.error(response.message || 'Failed to add employee');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to add employee';
          this.toastService.error(errorMsg);
          this.handleError('Failed to add employee', error);
        }
      });
  }

  saveEmployee(): void {
    if (!this.isValid(this.selectedEmployee) || !this.selectedEmployee?.id) {
      this.toastService.warning('Invalid employee data');
      return;
    }

    const dto = this.mapToDto(this.selectedEmployee);

    this.isLoading = true;
    this.service.update(this.selectedEmployee.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || 'Employee updated successfully');
            this.handleCrudSuccess('Employee updated successfully', ModalType.FORM);
          } else {
            this.toastService.error(response.message || 'Failed to update employee');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to update employee';
          this.toastService.error(errorMsg);
          this.handleError('Failed to update employee', error);
        }
      });
  }

  openDeleteModal(employee: Employee) {
    this.selectedEmployee = employee;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('confirmDeleteModal')
    );
    modal.show();
  }

  confirmDelete() {
    if (!this.selectedEmployee) {
      this.toastService.warning('No employee selected');
      return;
    }

    const id = this.selectedEmployee.id;
    const name = this.selectedEmployee.name;

    this.isLoading = true;
    this.service.remove(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || `Employee ${name} deleted successfully`);
            this.loadItems();
            // Close modal
            const modal = (window as any).bootstrap.Modal.getInstance(
              document.getElementById('confirmDeleteModal')
            );
            if (modal) modal.hide();
          } else {
            this.toastService.error(response.message || 'Failed to delete employee');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to delete employee';
          this.toastService.error(errorMsg);
          this.handleError('Failed to delete employee', error);
        }
      });
  }

  /**
   * Toggle employee active status
   */
  override toggleActive(employee: Employee): void {
    this.isLoading = true;
    this.service.activeUpdate(employee.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(response.message || 'Status updated successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to toggle status');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to toggle status';
          this.toastService.error(errorMsg);
          this.handleError('Failed to toggle active status', error);
        }
      });
  }

  /**
   * Override base class error handling to clear old error messages
   */
  override clearError(): void {
    this.errorMessage = '';
  }
}