// src/app/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage = '';
  loading = false;
  returnUrl = '/inventory/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl =
      decodeURIComponent(this.route.snapshot.queryParams['returnUrl'] || '/inventory/dashboard');

    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  const { login, password } = this.loginForm.value;

  this.authService.login(login, password).subscribe({
    next: (response: any) => {
      this.loading = false;

      if (response.status === 200 || response.status === 'success') {

        // ✅ Token is already saved by AuthService
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.errorMessage = response.message || 'Login failed';
      }
    },
    error: (error) => {
      this.loading = false;
      this.errorMessage = error.error?.message || 'Invalid credentials. Please try again.';
    }
  });
}

}
