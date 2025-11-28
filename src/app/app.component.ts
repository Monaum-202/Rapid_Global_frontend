import { Component } from '@angular/core';
import { IdleService } from './core/services/feature/idle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Rapid-global';

  constructor(private idleService: IdleService) {}

  ngOnInit() {
  window.addEventListener('beforeunload', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  });
}

}
