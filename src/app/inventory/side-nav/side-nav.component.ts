import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
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

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.detectActiveModule(event.urlAfterRedirects);
      }
    });
  }

  loadSidebar() {
    this.sidebarService.getSidebar().subscribe({
      next: (res) => {
        this.sidebarData = res.data;
        this.detectActiveModule(this.router.url);
      },
      error: (err) => console.error(err)
    });
  }

  toggleModule(id: number) {
    this.activeModuleId = this.activeModuleId === id ? null : id;
  }

  detectActiveModule(route: string) {
    for (const module of this.sidebarData) {
      if (module.menus?.some(menu => route.startsWith(menu.route))) {
        this.activeModuleId = module.id;
        return;
      }
    }
    this.activeModuleId = null;
  }
}
