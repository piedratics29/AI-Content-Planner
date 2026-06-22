import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div id="login-container" class="min-h-screen flex items-center justify-center bg-slate-50 px-3 sm:px-4 py-6 sm:py-12">
      <div id="login-card" class="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-8">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-4 shadow-sm">
            <mat-icon class="scale-125">auto_stories</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">AI Content Planner</h1>
          <p class="text-sm text-slate-500 mt-1">Transform concepts into highly scheduled posts</p>
        </div>

        <!-- Alert Notification -->
        @if (errorMessage()) {
          <div class="mb-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-start gap-3 border border-red-100 animate-slide-up">
            <mat-icon class="shrink-0 text-red-500">error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Informative Seed/Demo Box -->
        <div class="mb-6 p-4 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600">
          <div class="font-semibold text-violet-700 mb-1 flex items-center gap-1">
            <mat-icon class="text-xs scale-90">info</mat-icon> Quick Sign-In Options:
          </div>
          <p class="mb-2">Enter these credentials to quickly test pre-populated dummy schedules, or click register below to make a custom user:</p>
          <div class="flex flex-col gap-1 font-mono text-slate-700 leading-none">
            <div>Email: <span class="select-all font-semibold text-violet-800">demo&#64;example.com</span></div>
            <div class="mt-1">Pass: <span class="select-all font-semibold text-violet-800">password123</span></div>
          </div>
          <button (click)="fillDemoCredentials()" class="mt-3 text-xs text-violet-600 hover:text-violet-800 font-medium underline flex items-center gap-0.5 cursor-pointer">
            Auto-fill details <mat-icon class="text-[14px] w-3.5 h-3.5 flex items-center leading-none">bolt</mat-icon>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <mat-icon class="text-[20px] w-5 h-5 flex items-center">email</mat-icon>
              </span>
              <input 
                id="email" 
                type="email" 
                formControlName="email"
                placeholder="name@company.com" 
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                [class.border-red-500]="isFieldInvalid('email')"
              />
            </div>
            @if (isFieldInvalid('email')) {
              <p class="text-xs text-red-500 mt-1 select-none">Please enter a valid email address.</p>
            }
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <mat-icon class="text-[20px] w-5 h-5 flex items-center">lock</mat-icon>
              </span>
              <input 
                id="password" 
                [type]="showPassword() ? 'text' : 'password'" 
                formControlName="password"
                placeholder="••••••••" 
                class="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                [class.border-red-500]="isFieldInvalid('password')"
              />
              <button 
                type="button" 
                (click)="togglePassword()" 
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <mat-icon class="text-[20px] w-5 h-5 flex items-center">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <p class="text-xs text-red-500 mt-1 select-none">Password must be at least 6 characters.</p>
            }
          </div>

          <!-- Submit Button -->
          <button 
            id="btn-login"
            type="submit" 
            [disabled]="loadingSignal()"
            class="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
          >
            @if (loadingSignal()) {
              <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              <span>Signing in...</span>
            } @else {
              <span>Sign In</span>
              <mat-icon class="text-[18px] w-4.5 h-4.5 flex items-center leading-none">arrow_forward</mat-icon>
            }
          </button>
        </form>

        <!-- Footer link -->
        <div class="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-6">
          Do not have an account? 
          <a [routerLink]="['/register']" class="text-violet-600 hover:text-violet-800 font-semibold underline">Register Now</a>
        </div>

      </div>
    </div>
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  loadingSignal = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    // Seed demographic user database for immediate logins
    if (typeof window !== 'undefined') {
      const usersRaw = localStorage.getItem('ai_content_planner_users_db');
      if (!usersRaw) {
        localStorage.setItem('ai_content_planner_users_db', JSON.stringify([
          {
            id: 'u_1',
            name: 'Demo System Creator',
            email: 'demo@example.com',
            password: 'password123'
          }
        ]));
      }
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  fillDemoCredentials() {
    this.loginForm.patchValue({
      email: 'demo@example.com',
      password: 'password123'
    });
    this.loginForm.markAsDirty();
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loadingSignal.set(true);
    this.errorMessage.set(null);

    // Minor visual simulation delay
    setTimeout(() => {
      const { email, password } = this.loginForm.value;
      const res = this.authService.login(email, password);
      
      this.loadingSignal.set(false);
      
      if (res.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set(res.error || 'Authentication error.');
      }
    }, 600);
  }
}
