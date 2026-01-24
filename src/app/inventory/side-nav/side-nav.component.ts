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

  constructor(
    private sidebarService: SidebarService,
    private router: Router
  ) {}

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

    // Module with menus → toggle only by click
    if (module.menus && module.menus.length > 0) {
      this.activeModuleId =
        this.activeModuleId === module.id ? null : module.id;
    }

    // Single route module (Dashboard)
    else if (module.route) {
      this.router.navigate([module.route]);
      this.activeModuleId = module.id;
    }
  }
}
