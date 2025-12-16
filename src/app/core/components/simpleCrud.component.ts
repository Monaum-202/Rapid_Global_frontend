import { Directive, OnDestroy, inject } from '@angular/core';
import { Subject, Observable, finalize, takeUntil } from 'rxjs';
import { BackendPaginator } from 'src/app/core/models/backend-paginator';
import { ToastService } from 'src/app/core/services/feature/toast.service';

export interface BaseEntity {
  id: number;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  visible: boolean;
}

export interface CrudService<T extends BaseEntity, TDto> {
  getAll(page: number, pageSize: number, search?: string): Observable<any>;
  create(dto: TDto): Observable<any>;
  update(id: number, dto: TDto): Observable<any>;
  // activeUpdate(id: number): Observable<any>;
  deleteEmployee?(id: number): Observable<any>;
  deletePaymentMethod?(id: number): Observable<any>;
  deleteSale?(id: number): Observable<any>;
  deleteExpense?(id: number): Observable<any>;
  // Add other delete method names as needed
}

@Directive()
export abstract class simpleCrudComponent<T extends BaseEntity, TDto> implements OnDestroy {
  items: T[] = [];
  selectedItem: T | null = null;

  isLoading = false;
  isSearching = false;
  errorMessage = '';
  searchTerm = '';
  currentSearchValue = '';
  showColumnDropdown = false;

  paginator = new BackendPaginator(10);
  readonly PAGE_SIZE_OPTIONS = [10, 5, 25, 50, 100];

  protected destroy$ = new Subject<void>();

  // Inject ToastService using inject() function for directives
  protected toastService = inject(ToastService);

  abstract columns: TableColumn<T>[];
  abstract service: CrudService<T, TDto>;
  abstract entityName: string;
  abstract entityNameLower: string;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load items with pagination and search
   */
  loadItems(isSearchOperation = false): void {
    if (isSearchOperation) {
      this.isSearching = true;
    } else {
      this.isLoading = true;
    }

    this.clearError();

    const searchParam = this.searchTerm.trim() || undefined;
    const request$ = this.service.getAll(
      this.paginator.currentPage,
      this.paginator.pageSize,
      searchParam
    );

    const startTime = Date.now();

    request$
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
            this.items = response.data.data || [];
            this.paginator.updateFromResponse(response.data);

            // Show success message for search operations
            if (isSearchOperation && this.searchTerm) {
              const count = this.items.length;
              this.toastService.info(`Found ${count} ${this.entityNameLower}${count !== 1 ? 's' : ''}`);
            }
          } else {
            this.toastService.error(response.message || `Failed to load ${this.entityNameLower}s`);
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || `Failed to load ${this.entityNameLower}s`;
          this.toastService.error(errorMsg);
          this.handleError(`Failed to load ${this.entityNameLower}s`, error);
        }
      });
  }

  /**
   * Handle search input
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentSearchValue = input.value.trim();
  }

  /**
   * Handle Enter key press for search
   */
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  /**
   * Handle search button click
   */
  onSearchButtonClick(): void {
    this.performSearch();
  }

  /**
   * Perform search operation
   */
  protected performSearch(): void {
    if (this.searchTerm === this.currentSearchValue) {
      return;
    }

    this.searchTerm = this.currentSearchValue;
    this.paginator.goToPage(0);
    this.loadItems(true);
  }

  /**
   * Clear search and reload
   */
  clearSearch(): void {
    this.currentSearchValue = '';
    this.searchTerm = '';
    this.paginator.goToPage(0);
    this.toastService.info('Search cleared');
    this.loadItems(true);
  }

  /**
   * Toggle column dropdown
   */
  toggleColumnDropdown(): void {
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  /**
   * Check if column is visible
   */
  isColumnVisible(key: string): boolean {
    return this.columns.find(c => c.key === key)?.visible ?? false;
  }

  /**
   * Toggle column visibility
   */
  toggleColumnVisibility(column: TableColumn<T>): void {
    column.visible = !column.visible;
  }

  /**
   * Get visible columns count (including actions column)
   */
  get visibleColumnsCount(): number {
    return this.columns.filter(c => c.visible).length + 1;
  }

  /**
   * Get visible columns
   */
  get visibleColumns(): TableColumn<T>[] {
    return this.columns.filter(c => c.visible);
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = Number(select.value);
    this.paginator.pageSize = newSize;
    this.paginator.goToPage(0);
    this.toastService.info(`Page size changed to ${newSize}`);
    this.loadItems();
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    this.paginator.goToPage(page);
    this.loadItems();
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.canGoNext) {
      this.paginator.nextPage();
      this.loadItems();
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.canGoPrevious) {
      this.paginator.previousPage();
      this.loadItems();
    }
  }

  /**
   * Check if can go to previous page
   */
  get canGoPrevious(): boolean {
    return this.paginator.currentPage > 0;
  }

  /**
   * Check if can go to next page
   */
  get canGoNext(): boolean {
    return this.paginator.currentPage < this.paginator.totalPages - 1;
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    return this.paginator.getPageNumbers();
  }

  /**
   * View item details
   */
  viewItem(item: T): void {
    this.selectedItem = { ...item };
  }

  /**
   * Edit item
   */
  editItem(item: T): void {
    this.selectedItem = { ...item };
  }

  /**
   * Delete item with toast notifications
   */
  deleteItem(item: T, itemName: string): void {
    if (!item.id) {
      this.toastService.warning('Invalid item selected');
      return;
    }

    const deleteMethod = (this.service as any)[`delete${this.entityName}`];
    if (!deleteMethod) {
      console.error(`Delete method not found for ${this.entityName}`);
      this.toastService.error(`Delete method not found for ${this.entityName}`);
      return;
    }

    this.isLoading = true;
    deleteMethod.call(this.service, item.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success(response.message || `${this.entityName} "${itemName}" deleted successfully`);
            this.handleCrudSuccess(`${this.entityName} deleted successfully`);
          } else {
            this.toastService.error(response.message || `Failed to delete ${this.entityNameLower}`);
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || `Failed to delete ${this.entityNameLower}`;
          this.toastService.error(errorMsg);
        }
      });
  }

  /**
   * Abstract methods to be implemented by child classes
   */
  abstract createNew(): T;
  abstract mapToDto(item: T): TDto;

  /**
   * Handle successful CRUD operations
   */
  protected handleCrudSuccess(message: string, modalId?: string): void {
    this.loadItems();
    if (modalId) this.closeModal(modalId);
    console.log(message);
  }

  /**
   * Handle errors
   */
  protected handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorMessage = error?.error?.message || message;
  }

  /**
   * Close Bootstrap modal
   */
  protected closeModal(modalId: string): void {
    const element = document.getElementById(modalId);
    if (!element) return;
    const modal = (window as any).bootstrap?.Modal.getInstance(element);
    modal?.hide();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Format number as currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date string
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get CSS class for active status badge
   */
  getActiveClass(active: boolean): string {
    return active ? 'badge bg-success' : 'badge bg-danger';
  }

  /**
   * Get text for active status
   */
  getActiveText(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  protected getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}