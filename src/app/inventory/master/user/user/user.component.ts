import { Component, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs';
import { TableColumn } from 'src/app/core/components/base-crud.component';
import { simpleCrudComponent } from 'src/app/core/components/simpleCrud.component';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { User, UserReqDto, UserService } from 'src/app/core/services/user/user.service';
import { Role, RoleService } from 'src/app/core/services/role/role.service';
import { AuthService } from 'src/app/core/services/auth.service';

enum ModalType {
  VIEW = 'userViewModal',
  FORM = 'userFormModal',
  DELETE = 'confirmDeleteModal'
}

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent extends simpleCrudComponent<User, UserReqDto> implements OnInit {
  entityName = 'User';
  entityNameLower = 'user';
  roles: Role[] = [];
  isEditMode = false;
  roleId = 0;

  columns: TableColumn<User>[] = [
    { key: 'userName', label: 'Username', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'fullName', label: 'Name', visible: true },
    { key: 'roleName', label: 'Role', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'isActive', label: 'Status', visible: true }
  ];

  get users(): User[] {
    return this.items;
  }

  get selectedUser(): User | null {
    return this.selectedItem;
  }

  set selectedUser(value: User | null) {
    this.selectedItem = value;
  }

  get filteredUsers(): User[] {
    return this.items;
  }

  constructor(
    public service: UserService,
    public pageHeaderService: PageHeaderService,
    public roleService: RoleService,
    public authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('User Management');
    this.loadItems();
    this.loadRoles();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
  }

  createNew(): User {
    return {
      id: 0,
      userName: '',
      email: '',
      password: '',
      fullName: '',
      isActive: true,
      country: '',
      phone: '',
      location: '',
      dateOfBirth: null,
      thumbnail: null,
      roleId: null,
      roleName: ''
    };
  }

  isValid(user: User | null): boolean {
    if (!user) return false;

    // For new users, password is required
    if (!this.isEditMode && (!user.password || user.password.trim() === '')) {
      return false;
    }

    return !!(
      user.userName?.trim() &&
      user.email?.trim() &&
      user.roleId
    );
  }

  mapToDto(user: User): UserReqDto {
    const dto: UserReqDto = {
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      country: user.country,
      phone: user.phone,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      thumbnail: user.thumbnail,
      roleId: user.roleId!
    };

    // Only include password if it's provided (for create or update)
    if (user.password && user.password.trim()) {
      dto.password = user.password;
    }

    return dto;
  }

  openAddModal(): void {
    this.selectedUser = this.createNew();
    this.isEditMode = false;
  }

  viewUser(user: User): void {
    this.viewItem(user);
  }

  editUser(user: User): void {
    this.selectedUser = {
      ...user,
      password: '', // Clear password for security
      roleId: Number(user.roleId)
    };
    this.isEditMode = true;
  }

  addUser(): void {
    if (!this.isValid(this.selectedUser)) {
      this.errorMessage = 'Please fill in all required fields (Username, Email, Password, Role)';
      return;
    }

    const dto = this.mapToDto(this.selectedUser!);

    this.isLoading = true;
    this.service.create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.handleCrudSuccess('User added successfully', ModalType.FORM);
          }
        },
        error: (error: any) => this.handleError('Failed to add user', error)
      });
  }

  saveUserForm(): void {
    if (this.isEditMode) {
      this.saveUser();
    } else {
      this.addUser();
    }
  }

  saveUser(): void {
    if (!this.isValid(this.selectedUser) || !this.selectedUser?.id) {
      this.errorMessage = 'Invalid user data';
      return;
    }

    const dto = this.mapToDto(this.selectedUser);

    this.isLoading = true;
    this.service.update(this.selectedUser.id, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.handleCrudSuccess('User updated successfully', ModalType.FORM);
          }
        },
        error: (error: any) => this.handleError('Failed to update user', error)
      });
  }

  openDeleteModal(user: User): void {
    this.selectedUser = user;
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById(ModalType.DELETE)
    );
    modal.show();
  }

  confirmDelete(): void {
    if (this.selectedUser) {
      this.deleteItem(this.selectedUser, this.selectedUser.userName);
    }
  }

  /**
   * Toggle user active/inactive status
   */

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    this.isLoading = true;

    this.service.updateStatus(user.id, newStatus)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadItems();
            console.log(`User ${action}d successfully`);
          } else {
            this.errorMessage = response.message || `Failed to ${action} user`;
            setTimeout(() => this.clearError(), 3000);
          }
        },
        error: (error: any) => this.handleError(`Failed to ${action} user`, error)
      });
  }


  loadUsers(isSearchOperation = false): void {
    this.loadItems(isSearchOperation);
  }

  loadRoles(): void {
    this.roleService.getAll(0, 100).subscribe({
      next: (res) => {
        this.roles = res.data.data.map(role => ({
          ...role,
          id: Number(role.id)
        }));
      },
      error: (err) => {
        console.error('Failed to load roles', err);
      }
    });
  }
}