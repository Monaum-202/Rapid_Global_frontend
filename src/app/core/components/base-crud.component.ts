import { Directive, OnDestroy } from '@angular/core';
import { Subject, Observable, finalize, takeUntil } from 'rxjs';
import { BackendPaginator } from 'src/app/core/models/backend-paginator';

export interface BaseEntity {
  id: number;
  status: boolean;
  sqn?: number;
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
  statusUpdate(id: number): Observable<any>;
  deleteEmployee?(id: number): Observable<any>;
  deletePaymentMethod?(id: number): Observable<any>;
  // Add other delete method names as needed
}

@Directive()
export abstract class BaseCrudComponent<T extends BaseEntity, TDto> implements OnDestroy {
  items: T[] = [];
  selectedItem: T | null = null;

  isLoading = false;
  isSearching = false;
  errorMessage = '';
  searchTerm = '';
  currentSearchValue = '';
  showColumnDropdown = false;

  paginator = new BackendPaginator(10);
  readonly PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

  protected destroy$ = new Subject<void>();

  abstract columns: TableColumn<T>[];
  abstract service: CrudService<T, TDto>;
  abstract entityName: string;
  abstract entityNameLower: string;

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
    const request$ = this.service.getAll(
      this.paginator.currentPage,
      this.paginator.pageSize,
      searchParam
    );

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isSearching = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.items = response.data.data || [];
            this.paginator.updateFromResponse(response.data);
          }
        },
        error: (error) => this.handleError(`Failed to load ${this.entityNameLower}s`, error)
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
    this.paginator.goToPage(0);
    this.loadItems(true);
  }

  clearSearch(): void {
    this.currentSearchValue = '';
    this.searchTerm = '';
    this.paginator.goToPage(0);
    this.loadItems(true);
  }

  toggleColumnDropdown(): void {
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  isColumnVisible(key: string): boolean {
    return this.columns.find(c => c.key === key)?.visible ?? false;
  }

  toggleColumnVisibility(column: TableColumn<T>): void {
    column.visible = !column.visible;
  }

  get visibleColumnsCount(): number {
    return this.columns.filter(c => c.visible).length + 1;
  }

  get visibleColumns(): TableColumn<T>[] {
    return this.columns.filter(c => c.visible);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.paginator.pageSize = Number(select.value);
    this.paginator.goToPage(0);
    this.loadItems();
  }

  goToPage(page: number): void {
    this.paginator.goToPage(page);
    this.loadItems();
  }

  nextPage(): void {
    this.paginator.nextPage();
    this.loadItems();
  }

  previousPage(): void {
    this.paginator.previousPage();
    this.loadItems();
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

  viewItem(item: T): void {
    this.selectedItem = { ...item };
  }

  editItem(item: T): void {
    this.selectedItem = { ...item };
  }

  toggleStatus(item: T): void {
    if (!item.id) return;

    this.service.statusUpdate(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            item.status = !item.status;
          }
        },
        error: (error) => this.handleError('Failed to update status', error)
      });
  }

  deleteItem(item: T, itemName: string): void {
    if (!item.id) return;

    const confirmed = confirm(`Are you sure you want to delete ${itemName}?`);
    if (!confirmed) return;

    const deleteMethod = (this.service as any)[`delete${this.entityName}`];
    if (!deleteMethod) {
      console.error(`Delete method not found for ${this.entityName}`);
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
            this.handleCrudSuccess(`${this.entityName} deleted successfully`);
          }
        },
        error: (error: any) => this.handleError(`Failed to delete ${this.entityNameLower}`, error)
      });
  }

  abstract createNew(): T;
  abstract isValid(item: T | null): boolean;
  abstract mapToDto(item: T): TDto;

  protected handleCrudSuccess(message: string, modalId?: string): void {
    this.loadItems();
    if (modalId) this.closeModal(modalId);
    console.log(message);
  }

  protected handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorMessage = error?.error?.message || message;
  }

  protected closeModal(modalId: string): void {
    const element = document.getElementById(modalId);
    if (!element) return;
    const modal = (window as any).bootstrap?.Modal.getInstance(element);
    modal?.hide();
  }

  clearError(): void {
    this.errorMessage = '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusClass(status: boolean): string {
    return status ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  protected getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}