import { Component, OnInit } from '@angular/core';

interface Supplier {
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
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css']
})
export class SuppliersComponent implements OnInit {

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;

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
    this.loadSuppliers();
    this.filterSuppliers();
  }

  // Load sample supplier data
  loadSuppliers(): void {
    this.suppliers = [
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
    this.filterSuppliers();
  }

  filterSuppliers(): void {
    if (!this.searchTerm) {
      this.filteredSuppliers = [...this.suppliers];
    } else {
      this.filteredSuppliers = this.suppliers.filter(supplier =>
        supplier.id.toLowerCase().includes(this.searchTerm) ||
        supplier.name.toLowerCase().includes(this.searchTerm) ||
        supplier.phone.toLowerCase().includes(this.searchTerm) ||
        supplier.address.toLowerCase().includes(this.searchTerm)
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

  get paginatedSuppliers(): Supplier[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSuppliers.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSuppliers.length / this.pageSize);
  }

  get startEntry(): number {
    return this.filteredSuppliers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredSuppliers.length ? this.filteredSuppliers.length : end;
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

  // View supplier details
  viewSupplier(supplier: Supplier): void {
    this.selectedSupplier = supplier;
  }

  // Edit supplier (placeholder for actual implementation)
  editSupplier(supplier: Supplier): void {
    console.log('Edit supplier:', supplier);
    // Implement edit logic here
  }

  // Save supplier (placeholder for actual implementation)
  saveSupplier(): void {
    console.log('Save supplier');
    // Implement save logic here
  }
}