// ─── User Roles ────────────────────────────────────────────────────────────────
export type UserRole = 'FO'| 'FC' | 'PC' | 'GL' | 'CSH' | 'SH' | 'CH';

export const ROLE_HIERARCHY: UserRole[] = ['FO', 'FC', 'PC', 'GL', 'CSH', 'SH', 'CH'];

export const ROLE_LABELS: Record<UserRole, string> = {
  FO: 'Field Officer',
  FC: 'Field Coordinator',
  PC: 'Program Coordinator',
  GL: 'Group Leader',
  CSH: 'Cocoa Sustainability Head',
  SH: 'Sustainability Head',
  CH: 'Country Head'
};

export const ROLE_SUBORDINATE: Record<UserRole, string> = {
  FO: '',
  FC: 'Field Officers',
  PC: 'Field Coordinators',
  GL: 'Program Coordinators',
  CSH: 'Group Leaders',
  SH: 'Cocoa Sustainability Heads',
  CH: 'Sustainability Heads'
};

// ─── Auth Models ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  region?: string;
  managerId?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Shape returned by POST /api/Auth/login
export interface LoginApiData {
  token: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  fullName: string;
  role: UserRole;
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  data: LoginApiData;
  errors: unknown;
}

// ─── Report Models ──────────────────────────────────────────────────────────────
export type TaskCategory = 'GAP' | 'GEP' | 'GSP';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface TrainingSession {
  id: string;
  title: string;
  date: string;
  participants: number;
  category: TaskCategory;
  location: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  farmersVisited: number;
  completedDate: string;
  notes?: string;
  location: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
  comments?: string;
}

export interface SubordinateReport {
  userId: string;
  fullName: string;
  role: UserRole;
  farmersVisited: number;
  gapCount: number;
  gepCount: number;
  gspCount: number;
  status: ApprovalStatus;
  approvalDate?: string;
  approvedBy?: string;
  auditLogs: AuditLog[];
  tasks: Task[];
  trainingSessions: TrainingSession[];
  isExpanded?: boolean;
}

export interface DashboardSummary {
  totalSubordinates: number;
  totalFarmersVisited: number;
  totalGAP: number;
  totalGEP: number;
  totalGSP: number;
  pendingApprovals: number;
  approvedCount: number;
  canApprove: boolean;
  lastUpdated: string;
  subordinates: SubordinateReport[];
}

// ─── Download Report ───────────────────────────────────────────────────────────
export interface DownloadOptions {
  type: 'farm-visits' | 'training';
  format: 'csv' | 'excel';
  dateFrom?: string;
  dateTo?: string;
}

// ─── API Response Wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  timestamp: string;
}

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard API Response ────────────────────────────────────────────────────
export interface DashboardApiReport {
  reportId: string;
  userName: string;
  status: number;
  farmersVisited: number;
  gapCount: number;
  gepCount: number;
  gspCount: number;
  trainingSessions: number;
  trainingAttendees: number;
  weekNumber: number;
  year: number;
}

export interface DashboardApiData {
  totalFarmersVisited: number;
  gapTaskCount: number;
  gepTaskCount: number;
  gspTaskCount: number;
  totalTrainingSessions: number;
  totalTrainingAttendees: number;
  pendingReportCount: number;
  approvedReportCount: number;
  subordinateReports: DashboardApiReport[];
}
