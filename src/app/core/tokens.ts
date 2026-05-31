import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/** When true, the global HTTP error interceptor will not show a modal for this request. */
export const SKIP_GLOBAL_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

/** @deprecated Use SKIP_GLOBAL_ERROR_HANDLING */
export const SKIP_ERROR_TOAST = SKIP_GLOBAL_ERROR_HANDLING;
