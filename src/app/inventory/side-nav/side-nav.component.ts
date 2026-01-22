// side-nav.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { SidebarModule, SidebarService } from 'src/app/core/services/sidebar/sidebar.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {

  sidebarData: SidebarModule[] = [];

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.loadSidebar();
  }

  loadSidebar() {
    this.sidebarService.getSidebar().subscribe({
      next: (res) => this.sidebarData = res.data,
      error: (err) => console.error('Sidebar load failed', err)
    });
  }
}