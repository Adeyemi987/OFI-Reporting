/**
 * Backend report approval status (numeric enum).
 * 0–5: pending approval chain, 6: approved, 7: rejected.
 */
export const REPORT_STATUS = {
  PendingFCApproval: 0,
  PendingPCApproval: 1,
  PendingGLApproval: 2,
  PendingCSHApproval: 3,
  PendingSHApproval: 4,
  PendingCHApproval: 5,
  Approved: 6,
  Rejected: 7
} as const;

export type FoDisplayStatus = 'pending' | 'approved' | 'rejected' | 'unknown';

const STATUS_NAME_TO_CODE: Record<string, number> = {
  PendingFCApproval: 0,
  PendingPCApproval: 1,
  PendingGLApproval: 2,
  PendingCSHApproval: 3,
  PendingSHApproval: 4,
  PendingCHApproval: 5,
  Approved: 6,
  Rejected: 7,
  pending_fc: 0,
  pending_pc: 1,
  pending_gl: 2,
  pending_csh: 3,
  pending_sh: 4,
  pending_ch: 5,
  approved: 6,
  rejected: 7
};

/** Normalize API status (number or enum name string) to 0–7, or null if unknown. */
export function normalizeReportStatusCode(status: string | number | null | undefined): number | null {
  if (status == null || status === '') {
    return null;
  }

  if (typeof status === 'number' && !Number.isNaN(status)) {
    return status >= 0 && status <= 7 ? status : null;
  }

  const raw = String(status).trim();
  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    return n >= 0 && n <= 7 ? n : null;
  }

  const fromName = STATUS_NAME_TO_CODE[raw] ?? STATUS_NAME_TO_CODE[raw.toLowerCase()];
  if (fromName !== undefined) {
    return fromName;
  }

  const lower = raw.toLowerCase().replace(/\s+/g, '');
  if (lower.includes('reject')) return REPORT_STATUS.Rejected;
  if (lower.includes('approv') && !lower.includes('pending')) return REPORT_STATUS.Approved;
  if (lower.includes('pending') || lower.includes('review') || lower.includes('submitted')) {
    return REPORT_STATUS.PendingFCApproval;
  }

  return null;
}

export function getFoDisplayStatus(status: string | number | null | undefined): FoDisplayStatus {
  const code = normalizeReportStatusCode(status);
  if (code === REPORT_STATUS.Approved) return 'approved';
  if (code === REPORT_STATUS.Rejected) return 'rejected';
  if (code !== null && code >= 0 && code <= 5) return 'pending';
  return 'unknown';
}

export function getFoReportStatusLabel(status: string | number | null | undefined): string {
  switch (getFoDisplayStatus(status)) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

/** CSS class suffix for status badge: status-pending | status-approved | status-rejected */
export function getFoReportStatusClass(status: string | number | null | undefined): string {
  return getFoDisplayStatus(status);
}

export type ReportUiStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

/** Maps UI status filter to API query param (enum 0–7). Pending uses 0–5 client-side when omitted. */
export function reportUiFilterToApiStatus(filter: ReportUiStatusFilter): number | undefined {
  switch (filter) {
    case 'approved':
      return REPORT_STATUS.Approved;
    case 'rejected':
      return REPORT_STATUS.Rejected;
    default:
      return undefined;
  }
}

export function matchesReportUiFilter(
  status: string | number | null | undefined,
  filter: ReportUiStatusFilter
): boolean {
  if (filter === 'all') return true;
  return getFoDisplayStatus(status) === filter;
}
