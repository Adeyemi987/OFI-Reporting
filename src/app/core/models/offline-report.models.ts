export type QueuedReportStatus = 'pending' | 'syncing' | 'failed';

export interface WeeklyReportSubmitPayload {
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  challenges: string;
  commonFindings: string;
  farmerVisitsJson: string;
  trainingSessionsJson: string;
  taskRecordsJson: string;
  evidenceType: string;
  evidenceFile: File;
}

export interface QueuedWeeklyReport {
  id: string;
  createdAt: number;
  status: QueuedReportStatus;
  lastError?: string;
  attemptCount: number;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  challenges: string;
  commonFindings: string;
  farmerVisitsJson: string;
  trainingSessionsJson: string;
  taskRecordsJson: string;
  evidenceType: string;
  evidenceFileName: string;
  evidenceFileType: string;
  evidenceBlob: Blob;
}

export interface QueuedReportSummary {
  id: string;
  createdAt: number;
  status: QueuedReportStatus;
  lastError?: string;
  attemptCount: number;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
}
