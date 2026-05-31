// FO Dashboard Models
export interface FODashboardData {
  totalReportsSubmitted: number;
  pendingApprovalCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalFarmerVisitRecords: number;
  uniqueFarmersReached: number;
  totalTrainingSessions: number;
  totalTrainingAttendees: number;
  recentReports: FORecentReport[];
}

export interface FORecentReport {
  reportId: string;
  userName: string;
  status: string | number;
  hierarchyLevel: string;
  farmersVisited: number;
  gapCount: number;
  gepCount: number;
  gspCount: number;
  trainingSessions: number;
  trainingAttendees: number;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  rejectionReason?: string;
}

export type FOReportStatus = 'Pending' | 'Approved' | 'Rejected';

export interface FOReportsPage {
  items: FORecentReport[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Weekly Report Models
export interface FarmVisit {
  farmerId: string;
  farmerName: string;
  title: string;
  visitDate: string;
  category: number;
  notes: string;
}

export interface TrainingAttendance {
  attendeeName: string;
  attendeeId: string;
}

export interface TrainingSession {
  title: string;
  sessionDate: string;
  category: number;
  attendances: TrainingAttendance[];
}

export interface TaskRecord {
  title: string;
  description: string;
  category: number;
  isCompleted: boolean;
  completedDate: string | null;
}

export interface WeeklyReportFormData {
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  challenges: string;
  commonFindings: string;
  farmVisits: FarmVisit[];
  trainingSessions: TrainingSession[];
  taskRecords: TaskRecord[];
  evidenceFile: File | null;
  evidenceType: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface WeeklyReportSubmission {
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  challenges: string;
  commonFindings: string;
  farmerVisitsJson: string;
  trainingSessionsJson: string;
  taskRecordsJson: string;
  evidenceFile: File;
  evidenceType: string;
}

export interface WeeklyReportResubmitPayload {
  challenges: string;
  commonFindings: string;
  farmerVisitsJson: string;
  trainingSessionsJson: string;
  taskRecordsJson: string;
  evidenceType: string;
  evidenceFile?: File;
}
