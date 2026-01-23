import { Component } from '@angular/core';
import { ToastService } from 'src/app/core/services/feature/toast.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';
import { Role, RoleService } from 'src/app/core/services/role/role.service';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent {

  roles: Role[] = [];
  selectedRole?: Role;

  constructor(
      public roleService: RoleService,
      public pageHeaderService: PageHeaderService,
      private toastService: ToastService
    ) {
    }

  ngOnInit() {
    this.roleService.getAll().subscribe(res => {
      this.roles = res.data.data;
    });
  }

  selectRole(role: Role) {
    this.selectedRole = role;
  }

}
