import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { User, UserReqDto, UserService } from 'src/app/core/services/user/user.service';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  profileData: any = {};
  passwordData: PasswordChangeData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private pageHeaderService: PageHeaderService
  ) {}

  ngOnInit(): void {
    this.pageHeaderService.setTitle('My Profile');
    this.loadCurrentUser();
  }

  /**
   * Load current logged-in user data
   */
  loadCurrentUser(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.isLoading = true;
    this.userService.getById(userId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.currentUser = response.data;
            this.initializeProfileData();
          }
        },
        error: (error: any) => {
          this.errorMessage = 'Failed to load profile';
          console.error('Error loading profile:', error);
          setTimeout(() => this.clearError(), 5000);
        }
      });
  }

  /**
   * Initialize profile form data
   */
  initializeProfileData(): void {
    if (this.currentUser) {
      this.profileData = {
        userName: this.currentUser.userName,
        email: this.currentUser.email,
        fullName: this.currentUser.fullName,
        phone: this.currentUser.phone,
        country: this.currentUser.country,
        location: this.currentUser.location,
        dateOfBirth: this.currentUser.dateOfBirth
          ? new Date(this.currentUser.dateOfBirth).toISOString().split('T')[0]
          : null,
        roleId: this.currentUser.roleId
      };
    }
  }

  /**
   * Update user profile
   */
  updateProfile(): void {
    if (!this.currentUser?.id) {
      this.errorMessage = 'User ID not found';
      return;
    }

    if (!this.isValidEmail(this.profileData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    const dto: UserReqDto = {
      userName: this.profileData.userName,
      email: this.profileData.email,
      fullName: this.profileData.fullName,
      phone: this.profileData.phone,
      country: this.profileData.country,
      location: this.profileData.location,
      dateOfBirth: this.profileData.dateOfBirth ? new Date(this.profileData.dateOfBirth) : null,
      roleId: this.profileData.roleId
    };

    this.isLoading = true;
    this.userService.update(this.currentUser.id, dto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Profile updated successfully!';
            this.currentUser = response.data;
            this.initializeProfileData();
            setTimeout(() => this.clearSuccess(), 3000);
          }
        },
        error: (error: any) => {
          this.errorMessage = error?.error?.message || 'Failed to update profile';
          console.error('Error updating profile:', error);
          setTimeout(() => this.clearError(), 5000);
        }
      });
  }

  /**
   * Change user password
   */
  changePassword(): void {
    if (!this.currentUser?.id) {
      this.errorMessage = 'User ID not found';
      return;
    }

    // Validate passwords
    if (this.passwordData.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters long';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      setTimeout(() => this.clearError(), 3000);
      return;
    }

    // Create DTO with password change
    const dto: UserReqDto = {
      userName: this.profileData.userName,
      email: this.profileData.email,
      password: this.passwordData.newPassword, // Include new password
      fullName: this.profileData.fullName,
      phone: this.profileData.phone,
      country: this.profileData.country,
      location: this.profileData.location,
      dateOfBirth: this.profileData.dateOfBirth ? new Date(this.profileData.dateOfBirth) : null,
      roleId: this.profileData.roleId
    };

    this.isLoading = true;
    this.userService.update(this.currentUser.id, dto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Password changed successfully!';
            this.resetPasswordForm();
            setTimeout(() => this.clearSuccess(), 3000);
          }
        },
        error: (error: any) => {
          this.errorMessage = error?.error?.message || 'Failed to change password';
          console.error('Error changing password:', error);
          setTimeout(() => this.clearError(), 5000);
        }
      });
  }

  /**
   * Reset profile form to original values
   */
  resetProfileForm(): void {
    this.initializeProfileData();
    this.successMessage = 'Form reset to original values';
    setTimeout(() => this.clearSuccess(), 2000);
  }

  /**
   * Reset password form
   */
  resetPasswordForm(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get password strength
   */
  getPasswordStrength(): string {
    const password = this.passwordData.newPassword;
    if (!password) return 'Weak';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  }

  /**
   * Get password strength width for progress bar
   */
  getPasswordStrengthWidth(): string {
    const strength = this.getPasswordStrength();
    if (strength === 'Weak') return '33%';
    if (strength === 'Medium') return '66%';
    return '100%';
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Clear success message
   */
  clearSuccess(): void {
    this.successMessage = '';
  }
}