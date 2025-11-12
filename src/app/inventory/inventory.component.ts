import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { PageHeaderService } from '../core/services/page-header/page-header.service';
import { SideNavComponent } from './side-nav/side-nav.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements AfterViewInit, OnInit {

  ngAfterViewInit() {
    // Example: add custom event handling if needed
    const links = document.querySelectorAll('#sidebarAccordion .nav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  title: string = '';
  searchPlaceholder: string = '';
  showSearch: boolean = true;

  constructor(private pageHeaderService: PageHeaderService) {}

  @ViewChild('sideNav') sideNav!: SideNavComponent;

  ngOnInit() {
    this.pageHeaderService.title$.subscribe((t) => (this.title = t));
    this.pageHeaderService.searchPlaceholder$.subscribe(
      (p) => (this.searchPlaceholder = p)
    );
  }

  onSearchInput(event: any) {
    console.log('Search input:', event.target.value);
  }

  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') console.log('Search submitted!');
  }

  onSearchButtonClick() {
    console.log('Search button clicked!');
  }

  toggleMenu() {
    this.sideNav.toggleSidebar();
  }
}
