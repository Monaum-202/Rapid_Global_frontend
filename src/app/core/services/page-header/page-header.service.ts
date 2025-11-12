// page-header.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  private titleSource = new BehaviorSubject<string>(''); // page title
  title$ = this.titleSource.asObservable();

  private searchPlaceholderSource = new BehaviorSubject<string>('Search...');
  searchPlaceholder$ = this.searchPlaceholderSource.asObservable();

  setTitle(title: string) {
    this.titleSource.next(title);
  }

  setSearchPlaceholder(placeholder: string) {
    this.searchPlaceholderSource.next(placeholder);
  }
}
