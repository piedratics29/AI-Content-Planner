import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div id="register-container" class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div id="register-card" class="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-4 shadow-sm">
            <mat-icon class="scale-125">person_add</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p class="text-sm text-slate-500 mt-1">Join AI Content Planner & manage content smarter</p>
        </div>

        <!-- Alert Notification -->
        @if (errorMessage()) {
          <div class="mb-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-start gap-3 border border-red-100 animate-slide-up">
            <mat-icon class="shrink-0 text-red-500">error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Form -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <!-- Name Input -->
          <div>
            <label for="name" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <mat-icon class="text-[20px] w-5 h-5 flex items-center">person</mat-icon>
              </span>
              <input 
                id="name" 
                type="text" 
                formControlName="name"
                placeholder="Alex Carter" 
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                [class.border-red-500]="isFieldInvalid('name')"
              />
            </div>
            @if (isFieldInvalid('name')) {
              <p class="text-xs text-red-500 mt-1 select-none">Please provide your full name.</p>
            }
          </div>

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
                placeholder="alex@company.com" 
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

          <!-- Terms Checkbox -->
          <div class="flex items-start gap-2 pt-1">
            <input 
              id="terms" 
              type="checkbox" 
              formControlName="terms"
              class="mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <label for="terms" class="text-xs text-slate-500 leading-tight select-none">
              I agree to the <span class="text-violet-600 hover:underline cursor-pointer">Terms of Service</span> and <span class="text-violet-600 hover:underline cursor-pointer">Privacy Policy</span>.
            </label>
          </div>
          @if (isFieldInvalid('terms')) {
            <p class="text-xs text-red-500 select-none">You must accept the terms to proceed.</p>
          }

          <!-- Submit Button -->
          <button 
            id="btn-register"
            type="submit" 
            [disabled]="loadingSignal()"
            class="w-full mt-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
          >
            @if (loadingSignal()) {
              <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              <span>Creating Account...</span>
            } @else {
              <span>Create Account</span>
              <mat-icon class="text-[18px] w-4.5 h-4.5 flex items-center leading-none">how_to_reg</mat-icon>
            }
          </button>
        </form>

        <!-- Footer link -->
        <div class="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-6">
          Already have an account? 
          <a [routerLink]="['/login']" class="text-violet-600 hover:text-violet-800 font-semibold underline">Sign In</a>
        </div>

      </div>
    </div>
  `
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm!: FormGroup;
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  loadingSignal = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms: [false, Validators.requiredTrue]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loadingSignal.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      const { name, email, password } = this.registerForm.value;
      const res = this.authService.register(name, email, password);
      
      this.loadingSignal.set(false);
      
      if (res.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set(res.error || 'Registration failed.');
      }
    }, 600);
  }
}
