// src/app/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  returnUrl = '/inventory/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
  this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/inventory/dashboard';

  if (this.authService.isAuthenticated()) {
    this.router.navigate([this.returnUrl]);
    return;
  }

  this.loginForm = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(3)]]
  });
}


 onSubmit(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  // ✅ Simulate successful login (no backend)
  this.loading = true;
  setTimeout(() => {
    this.loading = false;
    // Store fake token to fool AuthGuard
    localStorage.setItem('token', 'dev-token');
    this.router.navigate([this.returnUrl || '/inventory/dashboard']);
  }, 300);
}



  get f() {
    return this.loginForm.controls;
  }
}