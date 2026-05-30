import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResult } from '../models';
import { FODashboardData, WeeklyReportSubmission } from '../models/fo-dashboard.models';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class FODashboardService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

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
          recentReports: (Array.isArray(data?.recentReports) ? data.recentReports : []).map((r: any) => ({
            ...r,
            status: r.status ?? r.Status ?? 'Unknown',
            gapCount: r.gapTaskCount ?? r.gapCount ?? 0,
            gepCount: r.gepTaskCount ?? r.gepCount ?? 0,
            gspCount: r.gspTaskCount ?? r.gspCount ?? 0,
          }))
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

  getMyReports(pageNumber: number = 1, pageSize: number = 10): Observable<ApiResult<any>> {
    return this.api.get<ApiResult<any>>(`/api/Reports?PageNumber=${pageNumber}&PageSize=${pageSize}`);
  }

  getReportDetails(reportId: string): Observable<ApiResult<any>> {
    return this.api.get<ApiResult<any>>(`/api/Reports/${reportId}`);
  }
}
