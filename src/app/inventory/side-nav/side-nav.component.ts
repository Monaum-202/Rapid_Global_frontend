// side-nav.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  isMobileView = false;
  roleId = 0;

  expandSideBar() {
    this.isSidebarCollapsed = false;
    this.isMobileMenuOpen = false;
    this.isMobileView = false;
  }

  constructor(
    private authService: AuthService
  ) {
    // console.log('%c🧩 SideNavComponent constructed', 'color: lime;');
  }

  ngOnDestroy() {
    // console.log('%c💥 SideNavComponent destroyed', 'color: red; font-weight: bold;');
  }

  ngOnInit() {
    this.checkViewport();
    const id = this.authService.getRoleId();
    this.roleId = id ?? 0;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkViewport();
  }

  checkViewport() {
    this.isMobileView = window.innerWidth <= 768;

    // Auto-close mobile menu on resize to desktop
    if (!this.isMobileView && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }

    // Auto-collapse sidebar on small screens
    if (this.isMobileView) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar() {
    if (this.isMobileView) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
    const expandedEls = document.querySelectorAll('[aria-expanded="true"]');
    expandedEls.forEach((el: any) => el.click());

  }

  closeMobileMenu() {
    if (this.isMobileView) {
      this.isMobileMenuOpen = false;
    }
  }

  // Close mobile menu when clicking on a link
  onLinkClick() {
    this.closeMobileMenu();
  }
}