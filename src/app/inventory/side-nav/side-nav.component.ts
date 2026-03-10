import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService, SidebarModule } from 'src/app/core/services/sidebar/sidebar.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {

  sidebarData: SidebarModule[] = [];
  activeModuleId: number | null = null;
  isCollapsed = false;

  constructor(
    private sidebarService: SidebarService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSidebar();
  }

  loadSidebar() {
    this.sidebarService.getSidebar().subscribe({
      next: (res) => {
        this.sidebarData = res.data;
        // ❌ DO NOT auto-expand anything on load
      },
      error: (err) => console.error(err)
    });
  }

  onModuleClick(module: SidebarModule) {
    // If collapsed → expand first, then activate the module
    if (this.isCollapsed) {
      this.isCollapsed = false;
      this.activeModuleId = module.menus?.length ? module.id : null;

      if (!module.menus?.length && module.route) {
        this.router.navigate([module.route]);
      }
      return;
    }

    // Normal behaviour when expanded
    if (module.menus && module.menus.length > 0) {
      this.activeModuleId =
        this.activeModuleId === module.id ? null : module.id;
    } else if (module.route) {
      this.router.navigate([module.route]);
      this.activeModuleId = module.id;
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
