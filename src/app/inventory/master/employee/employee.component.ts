import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { Employee, EmployeeReqDto, EmployeeService, LendRecord } from 'src/app/core/services/employee/employee.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';

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

  constructor(
    public service: EmployeeService,
    public pageHeaderService: PageHeaderService
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
    if (!employee) return false;
    return !!(employee.name && employee.phone && employee.salary && employee.joiningDate);
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
  }

  viewEmployee(employee: Employee): void {
    this.lendCurrentPage = 1;
    this.viewItem(employee);
  }

  editEmployee(employee: Employee): void {
    this.isEditMode = true;
    this.editItem(employee);
  }

  deleteEmployee(employee: Employee): void {
    this.deleteItem(employee, employee.name);
  }

  loadEmployees(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  // Combined save method
  saveEmployeeForm(): void {
    if (this.isEditMode) {
      this.saveEmployee();
    } else {
      this.addEmployee();
    }
  }

  addEmployee(): void {
    if (!this.isValid(this.selectedEmployee)) {
      this.errorMessage = 'Please fill in all required fields';
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
            this.handleCrudSuccess('Employee added successfully', ModalType.FORM);
          }
        },
        error: (error) => this.handleError('Failed to add employee', error)
      });
  }

  saveEmployee(): void {
    if (!this.isValid(this.selectedEmployee) || !this.selectedEmployee?.id) {
      this.errorMessage = 'Invalid employee data';
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
            this.handleCrudSuccess('Employee updated successfully', ModalType.FORM);
          }
        },
        error: (error) => this.handleError('Failed to update employee', error)
      });
  }

  // ==================== Lend Pagination Methods ====================

  getLendsForCurrentPage(): LendRecord[] {
    if (!this.selectedEmployee?.lends?.data) {
      return [];
    }
    return this.selectedEmployee.lends.data;
  }

  getLendPageNumbers(): number[] {
    if (!this.selectedEmployee?.lends) {
      return [];
    }

    const totalPages = this.selectedEmployee.lends.last_page;
    const current = this.lendCurrentPage;
    const pages: number[] = [];

    // Show max 5 page numbers
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goToLendPage(page: number): void {
    if (page === this.lendCurrentPage || !this.selectedEmployee?.id) {
      return;
    }

    this.lendCurrentPage = page;
    this.loadEmployeeLends(this.selectedEmployee.id, page - 1);
  }

  nextLendPage(): void {
    if (this.selectedEmployee?.lends && this.lendCurrentPage < this.selectedEmployee.lends.last_page) {
      this.goToLendPage(this.lendCurrentPage + 1);
    }
  }

  previousLendPage(): void {
    if (this.lendCurrentPage > 1) {
      this.goToLendPage(this.lendCurrentPage - 1);
    }
  }

  private loadEmployeeLends(employeeId: number, page: number = 0): void {
    this.isLoadingLends = true;
    this.service.getById(employeeId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingLends = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success && this.selectedEmployee) {
            this.selectedEmployee.lends = response.data.lends;
          }
        },
        error: (error) => this.handleError('Failed to load lend details', error)
      });
  }
}