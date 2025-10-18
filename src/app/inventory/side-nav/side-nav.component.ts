// side-nav.component.ts
import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  isMobileView = false;

  ngOnInit() {
    this.checkViewport();
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