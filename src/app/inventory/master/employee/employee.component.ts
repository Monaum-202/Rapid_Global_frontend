import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { Employee, EmployeeReqDto, EmployeeService } from 'src/app/core/services/employee/employee.service';
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

  constructor(public service: EmployeeService,
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
    this.selectedEmployee = this.createNew();
  }

  viewEmployee(employee: Employee): void {
    this.viewItem(employee);
  }

  editEmployee(employee: Employee): void {
    this.editItem(employee);
  }

  // addEmployee(): void {
  //   if (!this.isValid(this.selectedEmployee)) {
  //     this.errorMessage = 'Please fill in all required fields';
  //     return;
  //   }

  //   const dto = this.mapToDto(this.selectedEmployee!);

  //   this.isLoading = true;
  //   this.service.create(dto)
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       finalize(() => this.isLoading = false)
  //     )
  //     .subscribe({
  //       next: (response) => {
  //         if (response.success) {
  //           this.handleCrudSuccess('Employee added successfully', ModalType.ADD);
  //         }
  //       },
  //       error: (error) => this.handleError('Failed to add employee', error)
  //     });
  // }

  // saveEmployee(): void {
  //   if (!this.isValid(this.selectedEmployee) || !this.selectedEmployee?.id) {
  //     this.errorMessage = 'Invalid employee data';
  //     return;
  //   }

  //   const dto = this.mapToDto(this.selectedEmployee);

  //   this.isLoading = true;
  //   this.service.update(this.selectedEmployee.id, dto)
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       finalize(() => this.isLoading = false)
  //     )
  //     .subscribe({
  //       next: (response) => {
  //         if (response.success) {
  //           this.handleCrudSuccess('Employee updated successfully', ModalType.EDIT);
  //         }
  //       },
  //       error: (error) => this.handleError('Failed to update employee', error)
  //     });
  // }

  deleteEmployee(employee: Employee): void {
    this.deleteItem(employee, employee.name);
  }

  loadEmployees(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

//    openAddModal(): void {
//   this.isEditMode = false;
//   this.selectedEmployee = this.createNew();
// }

// // Update the editEmployee method
// editEmployee(employee: Employee): void {
//   this.isEditMode = true;
//   this.editItem(employee);
// }

// Add this new combined save method
saveEmployeeForm(): void {
  if (this.isEditMode) {
    this.saveEmployee();
  } else {
    this.addEmployee();
  }
}

// Update the handleCrudSuccess calls in addEmployee and saveEmployee
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
}