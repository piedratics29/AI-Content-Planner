import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  
  // State
  private userSignal = signal<User | null>(null);
  
  // Expose read-only signals
  currentUser = computed(() => this.userSignal());
  isLoggedIn = computed(() => !!this.userSignal());

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('ai_content_planner_user');
        if (storedUser) {
          this.userSignal.set(JSON.parse(storedUser));
        }
      } catch {
        // Silent recovery
      }
    }
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false };
    
    try {
      const usersRaw = localStorage.getItem('ai_content_planner_users_db') || '[]';
      const users = JSON.parse(usersRaw) as UserRecord[];
      
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!foundUser) {
        return { success: false, error: 'User not found. Please register first.' };
      }
      
      if (foundUser.password !== password) {
        return { success: false, error: 'Invalid password. Please try again.' };
      }
      
      const sessionUser: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email
      };
      
      localStorage.setItem('ai_content_planner_user', JSON.stringify(sessionUser));
      this.userSignal.set(sessionUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Authentication failed.' };
    }
  }

  register(name: string, email: string, password: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false };
    
    try {
      if (!name || !email || !password) {
        return { success: false, error: 'All fields are required.' };
      }
      
      const usersRaw = localStorage.getItem('ai_content_planner_users_db') || '[]';
      const users = JSON.parse(usersRaw) as UserRecord[];
      
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: false, error: 'Email already registered. Try logging in.' };
      }
      
      const newUser: UserRecord = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password
      };
      
      users.push(newUser);
      localStorage.setItem('ai_content_planner_users_db', JSON.stringify(users));
      
      const sessionUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      };
      
      localStorage.setItem('ai_content_planner_user', JSON.stringify(sessionUser));
      this.userSignal.set(sessionUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Registration failed.' };
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_content_planner_user');
    }
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }
}
