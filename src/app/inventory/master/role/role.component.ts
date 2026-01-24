import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { BaseCrudComponent, TableColumn } from 'src/app/core/components/base-crud.component';
import { ToastService } from 'src/app/core/services/feature/toast.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Role, RoleService } from 'src/app/core/services/role/role.service';

enum ModalType {
  VIEW = 'roleModal',
  FORM = 'roleFormModal'
}

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent extends BaseCrudComponent<Role, Role> implements OnInit {
  entityName = 'Role';
  entityNameLower = 'role';
  isEditMode = false;

  columns: TableColumn<Role>[] = [
    { key: 'id', label: 'SL', visible: true },
    { key: 'name', label: 'Role Name', visible: true },
    { key: 'description', label: 'Description', visible: true },
    { key: 'active', label: 'Status', visible: false }
  ];

  get roles(): Role[] {
    return this.items;
  }

  get selectedRole(): Role | null {
    return this.selectedItem;
  }

  set selectedRole(value: Role | null) {
    this.selectedItem = value;
  }

  get filteredRoles(): Role[] {
    return this.items;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Role' : 'Add New Role';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Add Role';
  }

  constructor(
    public override service: RoleService,
    public pageHeaderService: PageHeaderService,
    protected toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Role Management');
    this.loadItems();
  }

  override createNew(): Role {
    return {
      id: 0,
      name: '',
      description: '',
      active: true
    };
  }

  override isValid(role: Role | null): boolean {
    if (!role) return false;
    return !!(role.name && role.name.trim().length > 0);
  }

  override mapToDto(role: Role): Role {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      active: role.active
    };
  }

  override loadItems(isSearchOperation = false): void {
    if (isSearchOperation) {
      this.isSearching = true;
    } else {
      this.isLoading = true;
    }

    this.clearError();

    const searchParam = this.searchTerm.trim() || undefined;
    const request$ = this.service.getAll(searchParam);

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
        next: (response: any) => {
          if (response.success && response.data) {
            this.items = (response.data.data || []).map((role: any) => ({
              ...role,
              active: true
            }));
            this.paginator.updateFromResponse(response.data);
          }
        },
        error: (error: any) => this.handleError(`Failed to load ${this.entityNameLower}s`, error)
      });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedRole = this.createNew();
  }

  editRole(role: Role): void {
    this.isEditMode = true;
    this.editItem(role);
  }

  viewRole(role: Role): void {
    this.viewItem(role);
  }

  saveRole(): void {
    if (!this.isValid(this.selectedRole)) {
      this.toastService.warning('Please enter a role name');
      return;
    }

    const dto = this.mapToDto(this.selectedRole!);
    this.isLoading = true;

    const operation = this.isEditMode && this.selectedRole?.id
      ? this.service.update(this.selectedRole.id, dto)
      : this.service.create(dto);

    operation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success(response.message || (this.isEditMode ? 'Role updated successfully' : 'Role added successfully'));
            const message = this.isEditMode
              ? 'Role updated successfully'
              : 'Role added successfully';
            this.handleCrudSuccess(message, ModalType.FORM);
          } else {
            this.toastService.error(response.message || 'Operation failed');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || (this.isEditMode ? 'Failed to update role' : 'Failed to add role');
          this.toastService.error(errorMsg);
          const message = this.isEditMode
            ? 'Failed to update role'
            : 'Failed to add role';
          this.handleError(message, error);
        }
      });
  }

  openDeleteModal(role: Role): void {
    this.selectedRole = role;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('confirmDeleteModal')
    );
    modal.show();
  }

  confirmDelete(): void {
    if (!this.selectedRole) {
      this.toastService.warning('No role selected');
      return;
    }

    const id = this.selectedRole.id;

    this.isLoading = true;
    this.service.remove(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success(response.message || 'Role deleted successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to delete role');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to delete role';
          this.toastService.error(errorMsg);
          this.handleError('Failed to delete role', error);
        }
      });
  }

  override toggleActive(role: Role): void {
    this.isLoading = true;
    this.service.activeUpdate(role.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success(response.message || 'Status updated successfully');
            this.loadItems();
          } else {
            this.toastService.error(response.message || 'Failed to toggle status');
          }
        },
        error: (error: any) => {
          const errorMsg = error?.error?.message || 'Failed to toggle status';
          this.toastService.error(errorMsg);
          this.handleError('Failed to toggle active status', error);
        }
      });
  }

  override clearError(): void {
    this.errorMessage = '';
  }
}