import { HttpErrorResponse } from '@angular/common/http';

export interface ParsedHttpError {
  title: string;
  message: string;
}

const AUTH_PATHS = ['/api/Auth/login', '/api/Auth/register'];
const GENERIC_HTTP_FAILURE = /^Http failure response for /;

export function shouldSkipGlobalErrorHandling(url: string): boolean {
  return AUTH_PATHS.some(path => url.includes(path));
}

/** Extract a user-facing message from any thrown HTTP or application error. */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return extractHttpErrorMessage(err);
  }

  if (err instanceof Error && err.message.trim()) {
    if (!GENERIC_HTTP_FAILURE.test(err.message)) {
      return err.message.trim();
    }
  }

  const shaped = err as { error?: unknown; message?: string; status?: number };
  if (shaped?.error instanceof HttpErrorResponse) {
    return extractHttpErrorMessage(shaped.error);
  }
  if (shaped?.error && typeof shaped.error === 'object') {
    const record = shaped.error as Record<string, unknown>;
    if (typeof record['message'] === 'string' && record['message'].trim()) {
      return record['message'].trim();
    }
  }
  if (typeof shaped?.error === 'string' && shaped.error.trim()) {
    const parsed = parseErrorBodyString(shaped.error);
    if (parsed) return parsed;
  }
  if (shaped?.message?.trim() && !GENERIC_HTTP_FAILURE.test(shaped.message)) {
    return shaped.message.trim();
  }

  return getDefaultHttpErrorMessage(typeof shaped?.status === 'number' ? shaped.status : 0);
}

export function extractHttpErrorMessage(err: HttpErrorResponse): string {
  const fromBody = parseErrorBody(err.error);
  if (fromBody) return fromBody;

  if (err.message?.trim() && !GENERIC_HTTP_FAILURE.test(err.message)) {
    return err.message.trim();
  }

  return getDefaultHttpErrorMessage(err.status);
}

function parseErrorBody(body: unknown): string | null {
  if (typeof body === 'string') {
    return parseErrorBodyString(body);
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['message'] === 'string' && record['message'].trim()) {
      return record['message'].trim();
    }
    if (typeof record['title'] === 'string' && record['title'].trim()) {
      return record['title'].trim();
    }
    if (Array.isArray(record['errors']) && record['errors'].length > 0) {
      const messages = record['errors']
        .map(item => (typeof item === 'string' ? item : String(item)))
        .filter(Boolean);
      if (messages.length) return messages.join('\n');
    }
    if (record['errors'] && typeof record['errors'] === 'object') {
      const messages = Object.values(record['errors'] as Record<string, unknown>)
        .flatMap(value => (Array.isArray(value) ? value : [value]))
        .map(item => (typeof item === 'string' ? item : String(item)))
        .filter(Boolean);
      if (messages.length) return messages.join('\n');
    }
  }

  return null;
}

function parseErrorBodyString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseErrorBody(parsed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function getHttpErrorTitle(status: number): string {
  switch (status) {
    case 0:
      return 'Connection Error';
    case 400:
      return 'Invalid Request';
    case 401:
      return 'Authentication Required';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation Error';
    case 500:
      return 'Server Error';
    case 502:
    case 503:
    case 504:
      return 'Service Unavailable';
    default:
      return status >= 500 ? 'Server Error' : 'Request Failed';
  }
}

export function parseHttpError(err: HttpErrorResponse): ParsedHttpError {
  return {
    title: getHttpErrorTitle(err.status),
    message: extractHttpErrorMessage(err)
  };
}

function getDefaultHttpErrorMessage(status: number): string {
  switch (status) {
    case 0:
      return 'Cannot connect to the server. Please check your connection and try again.';
    case 400:
      return 'The request could not be processed. Please review your input and try again.';
    case 401:
      return 'Your session is invalid or has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with the current state. Please refresh and try again.';
    case 422:
      return 'Some of the submitted information is invalid. Please review and try again.';
    case 500:
      return 'The server encountered an unexpected error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again in a moment.';
    default:
      return status >= 500
        ? 'Something went wrong on the server. Please try again later.'
        : 'Something went wrong. Please try again.';
  }
}
