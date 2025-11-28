import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class IdleService {

  private timeout: any;
  private readonly idleTime = 10 * 60 * 1000; //10 min

  constructor(private router: Router) {
    this.resetTimer();
    this.detectActivity();
  }

  detectActivity() {
    window.addEventListener('mousemove', () => this.resetTimer());
    window.addEventListener('keydown', () => this.resetTimer());
    window.addEventListener('click', () => this.resetTimer());
    window.addEventListener('scroll', () => this.resetTimer());
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.resetTimer();
      }
    });
  }

  resetTimer() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.logoutUser(), this.idleTime);
  }

  logoutUser() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }
}
