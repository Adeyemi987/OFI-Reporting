import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResult } from '../models';
import {
  FODashboardData,
  FORecentReport,
  FOReportsPage,
  WeeklyReportSubmission,
  WeeklyReportResubmitPayload
} from '../models/fo-dashboard.models';
import { HttpClient, HttpContext } from '@angular/common/http';
import { API_BASE_URL } from '../tokens';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../tokens';
import { throwError } from 'rxjs';
import {
  reportUiFilterToApiStatus,
  ReportUiStatusFilter
} from '../utils/fo-report-status.util';

@Injectable({ providedIn: 'root' })
export class FODashboardService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly dashboardRecentPageSize = 5;
  readonly myReportsPageSize = 10;
  readonly myReportsMaxPages = 10;

  getFODashboard(): Observable<FODashboardData> {
    return this.api.get<ApiResult<FODashboardData>>('/api/Dashboard/fo').pipe(
      map(res => {
        const data = res?.data;
        return {
          totalReportsSubmitted: data?.totalReportsSubmitted ?? 0,
          pendingApprovalCount: data?.pendingApprovalCount ?? 0,
          approvedCount: data?.approvedCount ?? 0,
          rejectedCount: data?.rejectedCount ?? 0,
          totalFarmerVisitRecords: data?.totalFarmerVisitRecords ?? 0,
          uniqueFarmersReached: data?.uniqueFarmersReached ?? 0,
          totalTrainingSessions: data?.totalTrainingSessions ?? 0,
          totalTrainingAttendees: data?.totalTrainingAttendees ?? 0,
          recentReports: []
        };
      }),
      catchError((error) => {
        console.error('FO Dashboard error:', error);
        return of({
          totalReportsSubmitted: 0,
          pendingApprovalCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalFarmerVisitRecords: 0,
          uniqueFarmersReached: 0,
          totalTrainingSessions: 0,
          totalTrainingAttendees: 0,
          recentReports: []
        });
      })
    );
  }

  getReportsPage(
    pageNumber: number,
    pageSize: number,
    statusFilter: ReportUiStatusFilter = 'all'
  ): Observable<FOReportsPage> {
    const apiStatus = reportUiFilterToApiStatus(statusFilter);
    const fetchPage = statusFilter === 'pending' ? 1 : pageNumber;
    const fetchSize = statusFilter === 'pending' ? 100 : pageSize;
    let url = `/api/Reports?PageNumber=${fetchPage}&PageSize=${fetchSize}`;
    if (apiStatus !== undefined) {
      url += `&status=${apiStatus}`;
    }

    return this.api.get<ApiResult<any>>(url).pipe(
      map(res => this.mapReportsPage(res?.data, pageNumber, pageSize, statusFilter)),
      catchError((error) => {
        console.error('Reports page error:', error);
        return of(this.mapReportsPage(null, pageNumber, pageSize, statusFilter));
      })
    );
  }

  getDashboardRecentReports(): Observable<FOReportsPage> {
    return this.getReportsPage(1, this.dashboardRecentPageSize);
  }

  submitWeeklyReport(data: WeeklyReportSubmission): Observable<ApiResult<any>> {
    const formData = new FormData();

    formData.append('weekNumber', data.weekNumber.toString());
    formData.append('year', data.year.toString());
    formData.append('weekStartDate', data.weekStartDate);
    formData.append('weekEndDate', data.weekEndDate);
    formData.append('challenges', data.challenges);
    formData.append('commonFindings', data.commonFindings);
    formData.append('farmerVisitsJson', data.farmerVisitsJson);
    formData.append('trainingSessionsJson', data.trainingSessionsJson);
    formData.append('taskRecordsJson', data.taskRecordsJson);
    formData.append('evidenceFile', data.evidenceFile);
    formData.append('evidenceType', data.evidenceType);

    return this.http.post<ApiResult<any>>(`${this.baseUrl}/api/Reports`, formData);
  }

  getMyReports(
    pageNumber: number = 1,
    pageSize: number = this.myReportsPageSize,
    statusFilter: ReportUiStatusFilter = 'all'
  ): Observable<FOReportsPage> {
    return this.getReportsPage(pageNumber, pageSize, statusFilter);
  }

  getReportDetails(reportId: string): Observable<ApiResult<any>> {
    return this.api.get<ApiResult<any>>(`/api/Reports/${reportId}`);
  }

  resubmitReport(reportId: string, data: WeeklyReportResubmitPayload): Observable<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('challenges', data.challenges);
    formData.append('commonFindings', data.commonFindings);
    formData.append('farmerVisitsJson', data.farmerVisitsJson);
    formData.append('trainingSessionsJson', data.trainingSessionsJson);
    formData.append('taskRecordsJson', data.taskRecordsJson);
    formData.append('evidenceType', data.evidenceType);
    if (data.evidenceFile) {
      formData.append('evidenceFile', data.evidenceFile);
    }

    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);

    return this.http.put(
      `${this.baseUrl}/api/Reports/${reportId}`,
      formData,
      {
        context,
        headers: { Accept: 'text/plain, application/json' },
        responseType: 'text'
      }
    ).pipe(
      map(response => this.parseActionResponse(response, 'Report resubmitted successfully.')),
      catchError(err => throwError(() => this.normalizeActionError(err, 'Failed to resubmit report.')))
    );
  }

  private parseActionResponse(response: string, fallbackMessage: string): { success: boolean; message: string } {
    const trimmed = (response ?? '').trim();
    if (!trimmed) {
      return { success: true, message: fallbackMessage };
    }

    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as ApiResult<unknown>;
        return {
          success: parsed.success ?? true,
          message: parsed.message ?? fallbackMessage
        };
      } catch {
        return { success: true, message: trimmed };
      }
    }

    return { success: true, message: trimmed };
  }

  private normalizeActionError(err: unknown, fallbackMessage: string): { error: { message: string } } {
    const e = err as { error?: unknown; message?: string };
    const message = typeof e?.error === 'string' && e.error.trim()
      ? e.error.trim()
      : (e?.error as { message?: string })?.message ?? fallbackMessage;
    return { error: { message } };
  }

  private mapReportsPage(
    data: any,
    pageNumber: number,
    pageSize: number,
    statusFilter: ReportUiStatusFilter = 'all'
  ): FOReportsPage {
    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];
    let mapped = items.map((item: any) => this.normalizeReportItem(item));

    if (statusFilter === 'pending') {
      mapped = mapped.filter((r: FORecentReport) => {
        const s = r.status;
        return s !== 'approved' && s !== 6 && s !== 'Approved' &&
          s !== 'rejected' && s !== 7 && s !== 'Rejected';
      });
    }

    const apiTotal = data?.totalCount ?? items.length;
    const totalCount = statusFilter === 'pending' ? mapped.length : apiTotal;
    const totalPages = Math.min(
      this.myReportsMaxPages,
      Math.max(1, Math.ceil(totalCount / pageSize))
    );

    return {
      items: mapped,
      totalCount,
      pageNumber,
      pageSize,
      totalPages
    };
  }

  private normalizeReportItem(r: any): FORecentReport {
    return {
      reportId: r.reportId ?? r.id ?? '',
      userName: r.userName ?? '',
      status: r.status ?? r.Status ?? 'Unknown',
      hierarchyLevel: r.hierarchyLevel ?? '',
      farmersVisited: r.farmersVisited ?? r.totalFarmersVisited ?? r.uniqueFarmersCount ?? 0,
      trainingSessions: r.trainingSessions ?? r.totalTrainingSessions ?? 0,
      gapCount: r.gapTaskCount ?? r.gapCount ?? 0,
      gepCount: r.gepTaskCount ?? r.gepCount ?? 0,
      gspCount: r.gspTaskCount ?? r.gspCount ?? 0,
      trainingAttendees: r.trainingAttendees ?? 0,
      weekNumber: r.weekNumber ?? 0,
      year: r.year ?? 0,
      weekStartDate: r.weekStartDate ?? '',
      weekEndDate: r.weekEndDate ?? '',
      rejectionReason: r.rejectionReason
    };
  }
}
