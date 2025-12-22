import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { Stock, StockService } from 'src/app/core/services/stock/stock.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';


@Component({
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit, OnDestroy {
  items: Stock[] = [];
  selectedItem: Stock | null = null;

  isLoading = false;
  isSearching = false;
  errorMessage = '';
  searchTerm = '';
  currentSearchValue = '';
  showColumnDropdown = false;

  protected destroy$ = new Subject<void>();

  columns: TableColumn<Stock>[] = [
    { key: 'productId', label: 'Product ID', visible: true },
    { key: 'productName', label: 'Product Name', visible: true },
    { key: 'currentQuantity', label: 'Current Stock', visible: true },
    { key: 'availableQuantity', label: 'Available', visible: true },
    { key: 'reservedQuantity', label: 'Reserved', visible: false },
    { key: 'minimumStockLevel', label: 'Min Level', visible: false },
    { key: 'unitName', label: 'Unit', visible: true },
    { key: 'stockStatus', label: 'Status', visible: true }
  ];

  constructor(
    public service: StockService,
    public pageHeaderService: PageHeaderService
  ) {}

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Stock List');
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems(isSearchOperation = false): void {
    if (isSearchOperation) {
      this.isSearching = true;
    } else {
      this.isLoading = true;
    }

    this.clearError();

    const searchParam = this.searchTerm.trim() || undefined;
    const startTime = Date.now();

    this.service.getAll(searchParam)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 1000 - elapsed);
          setTimeout(() => {
            this.isLoading = false;
            this.isSearching = false;
          }, remaining);
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.items = response.data || [];
          }
        },
        error: (error) => this.handleError('Failed to load stock items', error)
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentSearchValue = input.value.trim();
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  onSearchButtonClick(): void {
    this.performSearch();
  }

  protected performSearch(): void {
    if (this.searchTerm === this.currentSearchValue) {
      return;
    }

    this.searchTerm = this.currentSearchValue;
    this.loadItems(true);
  }

  clearSearch(): void {
    this.currentSearchValue = '';
    this.searchTerm = '';
    this.loadItems(true);
  }

  toggleColumnDropdown(): void {
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  isColumnVisible(key: string): boolean {
    return this.columns.find(c => c.key === key)?.visible ?? false;
  }

  get visibleColumnsCount(): number {
    return this.columns.filter(c => c.visible).length + 1;
  }

  viewStock(stock: Stock): void {
    this.selectedItem = { ...stock };
  }

  // Template-friendly getters
  get stocks(): Stock[] {
    return this.items;
  }

  get selectedStock(): Stock | null {
    return this.selectedItem;
  }

  set selectedStock(value: Stock | null) {
    this.selectedItem = value;
  }

  get filteredStocks(): Stock[] {
    return this.items;
  }

  // Get stock status badge class
  getStatusClass(status: string): string {
    switch (status) {
      case 'LOW':
        return 'bg-warning';
      case 'OUT_OF_STOCK':
        return 'bg-danger';
      case 'NORMAL':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  // Get stock status display text
  getStatusText(status: string): string {
    switch (status) {
      case 'LOW':
        return 'Low Stock';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      case 'NORMAL':
        return 'Normal';
      default:
        return status;
    }
  }

  protected handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorMessage = error?.error?.message || message;
  }

  clearError(): void {
    this.errorMessage = '';
  }
}