import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then(m => m.Login),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register').then(m => m.Register),
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./planner/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./planner/calendar').then(m => m.Calendar),
    canActivate: [authGuard]
  },
  {
    path: 'prompts',
    loadComponent: () => import('./planner/prompts').then(m => m.Prompts),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
