import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ToastService } from 'src/app/core/services/feature/toast.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { RoleService, Role, AppModule } from 'src/app/core/services/role/role.service';

@Component({
  selector: 'app-role-permission',
  templateUrl: './role-permission.component.html',
  styleUrls: ['./role-permission.component.css']
})
export class RolePermissionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  roles: Role[] = [];
  selectedRole: Role | null = null;

  modules: AppModule[] = [];
  selectedMenuIds: number[] = [];

  isLoading = false;
  isLoadingModules = false;
  isSaving = false;
  errorMessage = '';

  // Track which modules are expanded
  expandedModules: Set<number> = new Set();

  constructor(
    private roleService: RoleService,
    private toastService: ToastService,
    private pageHeaderService: PageHeaderService
  ) {}

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Role Permissions');
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService.getAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.roles = res.data.data;
          } else {
            this.toastService.error(res.message || 'Failed to load roles');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to load roles';
          this.toastService.error(errorMsg);
          this.errorMessage = errorMsg;
        }
      });
  }

  onRoleSelect(): void {
    if (!this.selectedRole) {
      this.modules = [];
      this.selectedMenuIds = [];
      return;
    }

    this.loadModules();
    this.loadRolePermissions(this.selectedRole.id);
  }

  loadModules(): void {
    this.isLoadingModules = true;
    this.roleService.getModulesWithMenus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingModules = false)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.modules = res.data;
            // Expand all modules by default
            this.modules.forEach(m => this.expandedModules.add(m.id));
          } else {
            this.toastService.error(res.message || 'Failed to load modules');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to load modules';
          this.toastService.error(errorMsg);
          this.errorMessage = errorMsg;
        }
      });
  }

  loadRolePermissions(roleId: number): void {
    this.selectedMenuIds = [];
    this.roleService.getRolePermissions(roleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            res.data.forEach(module => {
              module.menus.forEach(menu => this.selectedMenuIds.push(menu.id));
            });
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to load role permissions';
          this.toastService.error(errorMsg);
        }
      });
  }

  toggleMenu(menuId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedMenuIds.includes(menuId)) {
        this.selectedMenuIds.push(menuId);
      }
    } else {
      this.selectedMenuIds = this.selectedMenuIds.filter(id => id !== menuId);
    }
  }

  toggleModule(module: AppModule, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const menuIds = module.menus.map(m => m.id);

    if (checked) {
      // Add all menus of this module
      menuIds.forEach(id => {
        if (!this.selectedMenuIds.includes(id)) {
          this.selectedMenuIds.push(id);
        }
      });
    } else {
      // Remove all menus of this module
      this.selectedMenuIds = this.selectedMenuIds.filter(id => !menuIds.includes(id));
    }
  }

  isModuleChecked(module: AppModule): boolean {
    if (!module.menus || module.menus.length === 0) return false;
    const menuIds = module.menus.map(m => m.id);
    return menuIds.every(id => this.selectedMenuIds.includes(id));
  }

  isModuleIndeterminate(module: AppModule): boolean {
    if (!module.menus || module.menus.length === 0) return false;
    const menuIds = module.menus.map(m => m.id);
    const selectedCount = menuIds.filter(id => this.selectedMenuIds.includes(id)).length;
    return selectedCount > 0 && selectedCount < menuIds.length;
  }

  toggleModuleExpansion(moduleId: number): void {
    if (this.expandedModules.has(moduleId)) {
      this.expandedModules.delete(moduleId);
    } else {
      this.expandedModules.add(moduleId);
    }
  }

  isModuleExpanded(moduleId: number): boolean {
    return this.expandedModules.has(moduleId);
  }

  savePermissions(): void {
    if (!this.selectedRole) {
      this.toastService.warning('Please select a role');
      return;
    }

    const moduleIds = this.modules.map(m => m.id);
    const payload = {
      roleId: this.selectedRole.id,
      moduleIds,
      menuIds: this.selectedMenuIds
    };

    this.isSaving = true;
    this.roleService.saveRolePermissions(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success(res.message || 'Permissions saved successfully');
          } else {
            this.toastService.error(res.message || 'Failed to save permissions');
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Failed to save permissions';
          this.toastService.error(errorMsg);
          this.errorMessage = errorMsg;
        }
      });
  }

  selectAll(): void {
    this.selectedMenuIds = [];
    this.modules.forEach(module => {
      module.menus.forEach(menu => {
        this.selectedMenuIds.push(menu.id);
      });
    });
    this.toastService.success('All permissions selected');
  }

  clearAll(): void {
    this.selectedMenuIds = [];
    this.toastService.success('All permissions cleared');
  }

  clearError(): void {
    this.errorMessage = '';
  }

  get selectedCount(): number {
    return this.selectedMenuIds.length;
  }

  get totalMenuCount(): number {
    return this.modules.reduce((sum, module) => sum + (module.menus?.length || 0), 0);
  }
}