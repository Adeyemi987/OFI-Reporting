import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';
import { environment } from '../environments/environment';
import { API_BASE_URL } from './core/tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
