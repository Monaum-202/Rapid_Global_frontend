import { Component, OnInit } from '@angular/core';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalTransactions: number;
  due: number;
}

interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  // Table settings
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  showColumnDropdown = false;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'name', label: 'NAME', visible: true },
    { key: 'phone', label: 'PHONE', visible: true },
    { key: 'address', label: 'ADDRESS', visible: true },
    { key: 'totalTransactions', label: 'TOTAL TRANSACTIONS', visible: false },
    { key: 'due', label: 'DUE', visible: true }
  ];

  ngOnInit(): void {
    this.loadCustomers();
    this.filterCustomers();
  }

  // Load sample customer data
  loadCustomers(): void {
    this.customers = [
      {
        id: '#PR-00002',
        name: 'John Doe',
        phone: '+8801712345678',
        address: 'Dhaka, Bangladesh',
        totalTransactions: 18400,
        due: 1551
      },
      {
        id: '#PR-00003',
        name: 'Jane Smith',
        phone: '+8801999888777',
        address: 'Chattogram, Bangladesh',
        totalTransactions: 25000,
        due: 2200
      },
      {
        id: '#PR-00004',
        name: 'Michael Johnson',
        phone: '+8801555444333',
        address: 'Sylhet, Bangladesh',
        totalTransactions: 15000,
        due: 500
      },
      {
        id: '#PR-00005',
        name: 'Sarah Williams',
        phone: '+8801666777888',
        address: 'Rajshahi, Bangladesh',
        totalTransactions: 32000,
        due: 3200
      },
      {
        id: '#PR-00006',
        name: 'David Brown',
        phone: '+8801888999000',
        address: 'Khulna, Bangladesh',
        totalTransactions: 12500,
        due: 0
      }
    ];
  }

  // Search and filter
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.currentPage = 1;
    this.filterCustomers();
  }

  filterCustomers(): void {
    if (!this.searchTerm) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(customer =>
        customer.id.toLowerCase().includes(this.searchTerm) ||
        customer.name.toLowerCase().includes(this.searchTerm) ||
        customer.phone.toLowerCase().includes(this.searchTerm) ||
        customer.address.toLowerCase().includes(this.searchTerm)
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

  get paginatedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCustomers.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.pageSize);
  }

  get startEntry(): number {
    return this.filteredCustomers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredCustomers.length ? this.filteredCustomers.length : end;
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

  // View customer details
  viewCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
  }

  // Edit customer (placeholder for actual implementation)
  editCustomer(customer: Customer): void {
    console.log('Edit customer:', customer);
    // Implement edit logic here
  }

  // Save customer (placeholder for actual implementation)
  saveCustomer(): void {
    console.log('Save customer');
    // Implement save logic here
  }
}