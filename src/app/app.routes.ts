import { Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'reports/:userId',
        canActivate: [RoleGuard],
        data: { roles: ['FC'] },
        loadComponent: () =>
          import('./features/reports/report-details.component').then(m => m.ReportDetailsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'submit-report',
        loadComponent: () =>
          import('./features/reports/submit-weekly-report.component').then(m => m.SubmitWeeklyReportComponent)
      }
    ]
  },
  {
    path: 'submit-report',
    loadComponent: () =>
      import('./features/reports/submit-weekly-report.component').then(m => m.SubmitWeeklyReportComponent)
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/errors/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./features/errors/server-error.component').then(m => m.ServerErrorComponent)
  },
  { path: '**', redirectTo: 'not-found' }
];
