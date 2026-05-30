import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from '../tokens';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import {
  QueuedReportSummary,
  QueuedWeeklyReport,
  WeeklyReportSubmitPayload
} from '../models/offline-report.models';

const DB_NAME = 'ofi-reporting-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-reports';

@Injectable({ providedIn: 'root' })
export class OfflineReportSyncService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private db: IDBDatabase | null = null;
  private syncInProgress = false;

  readonly pendingReports = signal<QueuedReportSummary[]>([]);
  readonly isSyncing = signal(false);
  readonly isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      void this.trySyncAll();
    });
    window.addEventListener('offline', () => this.isOnline.set(false));

    void this.openDatabase()
      .then(() => this.refreshPendingList())
      .then(() => {
        if (navigator.onLine) {
          void this.trySyncAll();
        }
      });
  }

  async submitWeeklyReport(payload: WeeklyReportSubmitPayload): Promise<'submitted' | 'queued'> {
    if (!navigator.onLine) {
      await this.enqueue(payload);
      return 'queued';
    }

    try {
      await this.postToApi(payload);
      return 'submitted';
    } catch (err) {
      if (this.isNetworkError(err)) {
        await this.enqueue(payload);
        return 'queued';
      }
      throw err;
    }
  }

  async retryReport(id: string): Promise<void> {
    if (!navigator.onLine) {
      this.toast.show('Offline', 'Connect to the internet to sync this report.', 'warning', 4000);
      return;
    }
    await this.syncOne(id);
    await this.refreshPendingList();
    void this.trySyncAll();
  }

  async deleteQueuedReport(id: string): Promise<void> {
    await this.openDatabase();
    await this.idbDelete(id);
    await this.refreshPendingList();
    this.toast.show('Removed', 'Queued report removed from this device.', 'info', 3000);
  }

  async trySyncAll(): Promise<void> {
    if (!navigator.onLine || !this.auth.isAuthenticated() || this.syncInProgress) {
      return;
    }

    await this.openDatabase();
    const pending = await this.idbGetAll();
    const toSync = pending.filter(r => r.status === 'pending' || r.status === 'failed');
    if (toSync.length === 0) return;

    this.syncInProgress = true;
    this.isSyncing.set(true);

    let synced = 0;
    let failed = 0;

    for (const report of toSync) {
      try {
        await this.syncOne(report.id);
        synced++;
      } catch {
        failed++;
      }
    }

    await this.refreshPendingList();
    this.syncInProgress = false;
    this.isSyncing.set(false);

    if (synced > 0) {
      this.toast.show(
        'Reports Synced',
        `${synced} report${synced === 1 ? '' : 's'} submitted successfully.`,
        'success',
        5000
      );
    }
    if (failed > 0 && synced === 0) {
      this.toast.show(
        'Sync Incomplete',
        `${failed} report${failed === 1 ? '' : 's'} could not be submitted. Tap Retry on My Reports.`,
        'warning',
        6000
      );
    }
  }

  private async enqueue(payload: WeeklyReportSubmitPayload): Promise<string> {
    const record: QueuedWeeklyReport = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      status: 'pending',
      attemptCount: 0,
      weekNumber: payload.weekNumber,
      year: payload.year,
      weekStartDate: payload.weekStartDate,
      weekEndDate: payload.weekEndDate,
      challenges: payload.challenges,
      commonFindings: payload.commonFindings,
      farmerVisitsJson: payload.farmerVisitsJson,
      trainingSessionsJson: payload.trainingSessionsJson,
      taskRecordsJson: payload.taskRecordsJson,
      evidenceType: payload.evidenceType,
      evidenceFileName: payload.evidenceFile.name,
      evidenceFileType: payload.evidenceFile.type || 'application/octet-stream',
      evidenceBlob: payload.evidenceFile
    };

    await this.openDatabase();
    await this.idbPut(record);
    await this.refreshPendingList();
    return record.id;
  }

  private async syncOne(id: string): Promise<void> {
    const report = await this.idbGet(id);
    if (!report) return;

    await this.idbUpdate({ ...report, status: 'syncing', lastError: undefined });

    try {
      await this.postFromQueued(report);
      await this.idbDelete(id);
    } catch (err) {
      const message = this.extractErrorMessage(err);
      await this.idbUpdate({
        ...report,
        status: 'failed',
        lastError: message,
        attemptCount: report.attemptCount + 1
      });
      throw err;
    }
  }

  private async postToApi(payload: WeeklyReportSubmitPayload): Promise<void> {
    const formData = this.buildFormData(payload);
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/Reports`, formData, { context })
    );
  }

  private async postFromQueued(report: QueuedWeeklyReport): Promise<void> {
    const file = new File([report.evidenceBlob], report.evidenceFileName, {
      type: report.evidenceFileType
    });
    const payload: WeeklyReportSubmitPayload = {
      weekNumber: report.weekNumber,
      year: report.year,
      weekStartDate: report.weekStartDate,
      weekEndDate: report.weekEndDate,
      challenges: report.challenges,
      commonFindings: report.commonFindings,
      farmerVisitsJson: report.farmerVisitsJson,
      trainingSessionsJson: report.trainingSessionsJson,
      taskRecordsJson: report.taskRecordsJson,
      evidenceType: report.evidenceType,
      evidenceFile: file
    };
    await this.postToApi(payload);
  }

  private buildFormData(payload: WeeklyReportSubmitPayload): FormData {
    const formData = new FormData();
    formData.append('weekNumber', payload.weekNumber.toString());
    formData.append('year', payload.year.toString());
    formData.append('weekStartDate', payload.weekStartDate);
    formData.append('weekEndDate', payload.weekEndDate);
    formData.append('challenges', payload.challenges);
    formData.append('commonFindings', payload.commonFindings);
    formData.append('farmerVisitsJson', payload.farmerVisitsJson);
    formData.append('trainingSessionsJson', payload.trainingSessionsJson);
    formData.append('taskRecordsJson', payload.taskRecordsJson);
    formData.append('evidenceType', payload.evidenceType);
    formData.append('evidenceFile', payload.evidenceFile);
    return formData;
  }

  private async refreshPendingList(): Promise<void> {
    try {
      await this.openDatabase();
      const all = await this.idbGetAll();
      const summaries: QueuedReportSummary[] = all
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(r => ({
          id: r.id,
          createdAt: r.createdAt,
          status: r.status,
          lastError: r.lastError,
          attemptCount: r.attemptCount,
          weekNumber: r.weekNumber,
          year: r.year,
          weekStartDate: r.weekStartDate,
          weekEndDate: r.weekEndDate
        }));
      this.pendingReports.set(summaries);
    } catch {
      this.pendingReports.set([]);
    }
  }

  private isNetworkError(err: unknown): boolean {
    const e = err as { status?: number; statusText?: string };
    return e?.status === 0 || !navigator.onLine;
  }

  private extractErrorMessage(err: unknown): string {
    const e = err as { error?: { message?: string }; message?: string; status?: number };
    if (e?.status === 401) return 'Session expired. Please log in again and retry.';
    return e?.error?.message ?? e?.message ?? 'Failed to submit report.';
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error ?? new Error('Failed to open offline database.'));
    });
  }

  private idbPut(record: QueuedWeeklyReport): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private idbGet(id: string): Promise<QueuedWeeklyReport | null> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as QueuedWeeklyReport) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private idbGetAll(): Promise<QueuedWeeklyReport[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as QueuedWeeklyReport[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  private idbUpdate(record: QueuedWeeklyReport): Promise<void> {
    return this.idbPut(record);
  }

  private idbDelete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
