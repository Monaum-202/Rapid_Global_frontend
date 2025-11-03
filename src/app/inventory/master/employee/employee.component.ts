import { Component, OnInit } from '@angular/core';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  salary: number;
  address: string;
  totalTransactions: number;
  joiningDate: Date;
  sqn: number;
  status: boolean;
}

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

  // Table settings
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  showColumnDropdown = false;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'name', label: 'NAME', visible: true },
    { key: 'phone', label: 'PHONE', visible: true },
    { key: 'totalTransactions', label: 'TOTAL TRANSACTIONS', visible: false },
    { key: 'status', label: 'STATUS', visible: true }
  ];

  ngOnInit(): void {
    this.loadEmployees();
    this.filterEmployees();
  }

  // Load sample employee data
  loadEmployees(): void {
    this.employees = [
      {
        id: '#PR-00002',
        name: 'John Doe',
        email: 'sss@gmail.com',
        phone: '+8801712345678',
        address: 'Dhaka, Bangladesh',
        totalTransactions: 18400,
        salary: 50000,
        joiningDate: new Date('2022-01-15'),
        sqn: 1,
        status: true
      },
      {
        id: '#PR-00003',
        name: 'Jane Smith',
        email: 'sssss@f.com',
        phone: '+8801912345678',
        address: 'Chittagong, Bangladesh',
        totalTransactions: 15000,
        salary: 45000,
        joiningDate: new Date('2021-11-20'),
        sqn: 2,
        status: false
      }
    ];
  }

  // Search and filter
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.currentPage = 1;
    this.filterEmployees();
  }

  filterEmployees(): void {
    if (!this.searchTerm) {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.id.toLowerCase().includes(this.searchTerm) ||
        employee.name.toLowerCase().includes(this.searchTerm) ||
        employee.phone.toLowerCase().includes(this.searchTerm) ||
        employee.address.toLowerCase().includes(this.searchTerm)
      );
    }
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
    this.currentPage = 1;
  }

  get paginatedEmployees(): Employee[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredEmployees.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.pageSize);
  }

  get startEntry(): number {
    return this.filteredEmployees.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredEmployees.length ? this.filteredEmployees.length : end;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
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
    this.selectedEmployee = { ...employee }; // Create a copy
  }

  // Edit employee
  editEmployee(employee: Employee): void {
    this.selectedEmployee = { ...employee }; // Create a copy for editing
  }

  // Open add modal
  openAddModal(): void {
    // Initialize new empty employee
    this.selectedEmployee = {
      id: this.generateEmployeeId(),
      name: '',
      email: '',
      phone: '',
      salary: 0,
      address: '',
      totalTransactions: 0,
      joiningDate: new Date(),
      sqn: this.employees.length + 1,
      status: true
    };
  }

  // Generate new employee ID
  generateEmployeeId(): string {
    const maxId = this.employees.reduce((max, emp) => {
      const num = parseInt(emp.id.replace('#PR-', ''));
      return num > max ? num : max;
    }, 0);
    return `#PR-${String(maxId + 1).padStart(5, '0')}`;
  }

  // Add new employee
  addEmployee(): void {
    if (this.selectedEmployee) {
      this.employees.push({ ...this.selectedEmployee });
      this.filterEmployees();
      console.log('Employee added successfully');
    }
  }

  // Save employee
  saveEmployee(): void {
    if (this.selectedEmployee) {
      // Find and update the employee in the array
      const index = this.employees.findIndex(emp => emp.id === this.selectedEmployee!.id);
      if (index !== -1) {
        this.employees[index] = { ...this.selectedEmployee };
        this.filterEmployees();
        console.log('Employee updated successfully');
      }
    }
  }

  // Toggle status
  toggleStatus(employee: Employee): void {
    employee.status = !employee.status;
    // Optionally call backend API
    // this.employeeService.updateStatus(employee.id, employee.status).subscribe();
  }
}