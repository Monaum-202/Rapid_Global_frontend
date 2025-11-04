import { Component, OnInit } from '@angular/core';
import { Employee, EmployeeReqDto, EmployeeService } from 'src/app/core/services/employee.service';

interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isLoading = false;
  errorMessage = '';

  // Table settings
  pageSize = 10;
  currentPage = 0; // Backend uses 0-based indexing
  totalPages = 0;
  totalElements = 0;
  searchTerm = '';
  showColumnDropdown = false;
  filterStatus: boolean | null = null; // null = all, true = active, false = inactive

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'name', label: 'NAME', visible: true },
    { key: 'phone', label: 'PHONE', visible: true },
    { key: 'email', label: 'EMAIL', visible: false },
    { key: 'salary', label: 'SALARY', visible: false },
    { key: 'joiningDate', label: 'JOINING DATE', visible: false },
    { key: 'status', label: 'STATUS', visible: true }
  ];

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  // Load employees from API
  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const loadObservable = this.filterStatus !== null
      ? this.employeeService.getAllActive(this.filterStatus, this.currentPage, this.pageSize)
      : this.employeeService.getAll(this.currentPage, this.pageSize);

    loadObservable.subscribe({
      next: (response) => {
        if (response.success) {
          this.employees = response.data.data || [];
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
          this.filterEmployees();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.errorMessage = 'Failed to load employees. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Search and filter
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.filterEmployees();
  }

  filterEmployees(): void {
    if (!this.searchTerm) {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.id?.toString().toLowerCase().includes(this.searchTerm) ||
        employee.name?.toLowerCase().includes(this.searchTerm) ||
        employee.phone?.toLowerCase().includes(this.searchTerm) ||
        employee.email?.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  // Filter by status
  onStatusFilterChange(status: boolean | null): void {
    this.filterStatus = status;
    this.currentPage = 0;
    this.loadEmployees();
  }

  // Column visibility methods
  toggleColumnDropdown(): void {
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  isColumnVisible(key: string): boolean {
    const column = this.columns.find(col => col.key === key);
    return column ? column.visible : false;
  }

  get visibleColumnsCount(): number {
    return this.columns.filter(c => c.visible).length + 1; // +1 for actions column
  }

  // Pagination
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value);
    this.currentPage = 0;
    this.loadEmployees();
  }

  get paginatedEmployees(): Employee[] {
    return this.filteredEmployees; // Already paginated from backend
  }

  get startEntry(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get endEntry(): number {
    const end = (this.currentPage + 1) * this.pageSize;
    return end > this.totalElements ? this.totalElements : end;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadEmployees();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadEmployees();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadEmployees();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 2) {
        for (let i = 0; i <= 3; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 3) {
        for (let i = this.totalPages - 4; i < this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  }

  // View employee details
  viewEmployee(employee: Employee): void {
    this.selectedEmployee = { ...employee };
  }

  // Edit employee
  editEmployee(employee: Employee): void {
    this.selectedEmployee = { ...employee };
  }

  // Open add modal
  openAddModal(): void {
    // Get the highest sqn from current employees
    const maxSqn = this.employees.reduce((max, emp) => 
      emp.sqn > max ? emp.sqn : max, 0
    );

    this.selectedEmployee = {
      id: 0, // Will be generated by backend
      name: '',
      email: '',
      phone: '',
      salary: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      sqn: maxSqn + 1,
      status: true
    } as Employee;
  }

  // Add new employee
  addEmployee(): void {
    if (!this.selectedEmployee) return;

    const dto: EmployeeReqDto = {
      name: this.selectedEmployee.name,
      email: this.selectedEmployee.email,
      phone: this.selectedEmployee.phone,
      salary: this.selectedEmployee.salary,
      joiningDate: this.selectedEmployee.joiningDate,
      sqn: this.selectedEmployee.sqn
    };

    this.isLoading = true;
    this.employeeService.create(dto).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Employee added successfully');
          this.loadEmployees();
          this.closeModal('employeeAddModal');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error adding employee:', error);
        this.errorMessage = 'Failed to add employee. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Save employee (update)
  saveEmployee(): void {
    if (!this.selectedEmployee || !this.selectedEmployee.id) return;

    const dto: EmployeeReqDto = {
      name: this.selectedEmployee.name,
      email: this.selectedEmployee.email,
      phone: this.selectedEmployee.phone,
      salary: this.selectedEmployee.salary,
      joiningDate: this.selectedEmployee.joiningDate,
      sqn: this.selectedEmployee.sqn
    };

    this.isLoading = true;
    this.employeeService.update(this.selectedEmployee.id, dto).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Employee updated successfully');
          this.loadEmployees();
          this.closeModal('employeeEditModal');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        this.errorMessage = 'Failed to update employee. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Toggle status
  toggleStatus(employee: Employee): void {
    if (!employee.id) return;

    this.employeeService.statusUpdate(employee.id).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Status updated successfully');
          // Update local state
          employee.status = !employee.status;
        }
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.errorMessage = 'Failed to update status. Please try again.';
      }
    });
  }

  // Delete employee
  deleteEmployee(employee: Employee): void {
    if (!employee.id) return;

    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      this.isLoading = true;
      this.employeeService.delete(employee.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadEmployees();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          this.errorMessage = 'Failed to delete employee. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  // Helper to close modal programmatically
  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Clear error message
  clearError(): void {
    this.errorMessage = '';
  }
}