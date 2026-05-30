import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_LABELS, UserRole } from '../../../core/models';

interface TrainingAttendance {
  attendeeName: string;
  attendeeId: string;
}

interface TrainingSession {
  id: string;
  title: string;
  location: string;
  sessionDate: string;
  category: number;
  attendances: TrainingAttendance[];
}

interface FarmerVisit {
  id?: string;
  farmerId: string;
  farmerName: string;
  visitDate: string;
  location: string;
  topic?: string;
  category?: number;
  notes: string;
}

interface ReportDetail {
  reportId: string;
  userName: string;
  status: number;
  role?: UserRole | string;
  hierarchyLevel?: number;
  farmerVisits: FarmerVisit[];
  farmersVisitedCount?: number;
  gapCount: number;
  gepCount: number;
  gspCount: number;
  trainingSessions: TrainingSession[];
  trainingSessionsCount?: number;
  trainingAttendeesCount?: number;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  rejectionReason: string | null;
}

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="report-detail-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading report details...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <h3>Failed to load report</h3>
          <p>{{ error() }}</p>
          <button (click)="loadReport()" class="btn-retry">Retry</button>
        </div>
      } @else if (report()) {
        <div class="detail-header">
          <button (click)="goBack()" class="btn-back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
            Back to Reports
          </button>
          <div class="header-content">
            <div>
              <h1>Week {{ report()!.weekNumber }}, {{ report()!.year }} Report</h1>
              <p class="report-period">{{ formatDateRange(report()!.weekStartDate, report()!.weekEndDate) }}</p>
            </div>
            <span [class]="'status-badge status-' + getStatusClass(report()!.status)">
              {{ getStatusText(report()!.status) }}
            </span>
          </div>
        </div>

        <div class="detail-content">
          <div class="info-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
              <h2>User Information</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">{{ report()!.userName }}</span>
              </div>
              <div class="info-row">
                <span class="label">Role:</span>
                <span class="value">{{ userRoleLabel() }}</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              <h2>Report Period</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">Week Number:</span>
                <span class="value">Week {{ report()!.weekNumber }}</span>
              </div>
              <div class="info-row">
                <span class="label">Year:</span>
                <span class="value">{{ report()!.year }}</span>
              </div>
              <div class="info-row">
                <span class="label">Start Date:</span>
                <span class="value">{{ formatDate(report()!.weekStartDate) }}</span>
              </div>
              <div class="info-row">
                <span class="label">End Date:</span>
                <span class="value">{{ formatDate(report()!.weekEndDate) }}</span>
              </div>
            </div>
          </div>

          <div class="info-card full-width">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              <h2>Activity Statistics</h2>
            </div>
            <div class="card-body activity-body">
              <div class="activity-duo">
                <!-- Farm Visits -->
                <div class="activity-panel farm-panel">
                  <div class="panel-top">
                    <div class="panel-icon farm">
                      <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">Farm Visits</h3>
                      <p class="panel-subtitle">Field outreach this week</p>
                    </div>
                  </div>
                  <div class="panel-metrics">
                    <div class="metric-hero">
                      <span class="metric-hero-value">{{ farmVisitsCount() }}</span>
                      <span class="metric-hero-label">{{ farmVisitsCount() === 1 ? 'Visit' : 'Visits' }} recorded</span>
                    </div>
                    <div class="metric-pill">
                      <span class="metric-pill-value">{{ farmersVisitedCount() }}</span>
                      <span class="metric-pill-label">Farmers reached</span>
                    </div>
                  </div>
                  @if (farmVisitsList().length > 0) {
                    <ul class="panel-list">
                      @for (visit of farmVisitsList(); track $index) {
                        <li class="panel-list-item">
                          <div class="list-item-head">
                            <strong>{{ visit.farmerName || 'Unknown farmer' }}</strong>
                            @if (visit.category != null) {
                              <span [class]="'cat-chip cat-' + getCategoryKey(visit.category)">{{ getCategoryLabel(visit.category) }}</span>
                            }
                          </div>
                          <div class="list-item-meta">
                            @if (visit.topic) {
                              <span>{{ visit.topic }}</span>
                            }
                            @if (visit.location) {
                              <span class="meta-dot">·</span>
                              <span>{{ visit.location }}</span>
                            }
                          </div>
                          @if (visit.visitDate) {
                            <span class="list-item-date">{{ formatShortDate(visit.visitDate) }}</span>
                          }
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="panel-empty">No farm visits recorded for this report.</p>
                  }
                </div>

                <!-- Training -->
                <div class="activity-panel training-panel">
                  <div class="panel-top">
                    <div class="panel-icon training">
                      <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">Training</h3>
                      <p class="panel-subtitle">Sessions &amp; participation</p>
                    </div>
                  </div>
                  <div class="training-stats-row">
                    <div class="training-stat">
                      <span class="training-stat-value">{{ trainingSessionsCount() }}</span>
                      <span class="training-stat-label">Sessions</span>
                    </div>
                    <div class="training-stat-divider"></div>
                    <div class="training-stat">
                      <span class="training-stat-value">{{ trainingAttendeesCount() }}</span>
                      <span class="training-stat-label">Total attendees</span>
                    </div>
                    <div class="training-stat-divider"></div>
                    <div class="training-stat">
                      <span class="training-stat-value">{{ avgAttendeesPerSession() }}</span>
                      <span class="training-stat-label">Avg / session</span>
                    </div>
                  </div>
                  @if (trainingCategorySummary().length > 0) {
                    <div class="training-categories">
                      @for (item of trainingCategorySummary(); track item.label) {
                        <span [class]="'cat-chip cat-' + item.key">{{ item.count }} {{ item.label }}</span>
                      }
                    </div>
                  }
                  @if (trainingSessionsList().length > 0) {
                    <ul class="panel-list training-list">
                      @for (session of trainingSessionsList(); track $index) {
                        <li class="panel-list-item training-item">
                          <div class="list-item-head">
                            <strong>{{ session.title || 'Untitled session' }}</strong>
                            @if (session.category != null) {
                              <span [class]="'cat-chip cat-' + getCategoryKey(session.category)">{{ getCategoryLabel(session.category) }}</span>
                            }
                          </div>
                          <div class="list-item-meta">
                            @if (session.location) {
                              <span>{{ session.location }}</span>
                            }
                            @if (session.sessionDate) {
                              <span class="meta-dot">·</span>
                              <span>{{ formatShortDate(session.sessionDate) }}</span>
                            }
                          </div>
                          <div class="training-attendee-row">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                            </svg>
                            <span>{{ getSessionAttendeeCount(session) }} {{ getSessionAttendeeCount(session) === 1 ? 'attendee' : 'attendees' }}</span>
                          </div>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="panel-empty">No training sessions recorded for this report.</p>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="info-card full-width">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
              <h2>Task Breakdown</h2>
            </div>
            <div class="card-body">
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-icon gap">
                    <span class="stat-letter">GAP</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ report()!.gapCount }}</div>
                    <div class="stat-label">GAP Count</div>
                  </div>
                </div>

                <div class="stat-box">
                  <div class="stat-icon gep">
                    <span class="stat-letter">GEP</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ report()!.gepCount }}</div>
                    <div class="stat-label">GEP Count</div>
                  </div>
                </div>

                <div class="stat-box">
                  <div class="stat-icon gsp">
                    <span class="stat-letter">GSP</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ report()!.gspCount }}</div>
                    <div class="stat-label">GSP Count</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          @if (report()!.rejectionReason) {
            <div class="info-card full-width rejection-card">
              <div class="card-header">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <h2>Rejection Reason</h2>
              </div>
              <div class="card-body">
                <p class="rejection-text">{{ report()!.rejectionReason }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .report-detail-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      max-width: 500px;
      margin: 0 auto;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state svg {
      color: #cbd5e0;
      margin-bottom: 1rem;
    }

    .error-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 0.5rem 0;
    }

    .error-state p {
      color: #718096;
      margin: 0 0 2rem 0;
    }

    .btn-retry {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s;
    }

    .btn-retry:hover {
      transform: translateY(-2px);
    }

    .detail-header {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #f7fafc;
      color: #2d3748;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 1.5rem;
    }

    .btn-back:hover {
      background: #e2e8f0;
      transform: translateX(-5px);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .report-period {
      color: #718096;
      font-size: 1rem;
      margin: 0;
    }

    .status-badge {
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .status-0 { background: #feebc8; color: #7c2d12; }
    .status-1 { background: #bee3f8; color: #2c5282; }
    .status-2 { background: #c6f6d5; color: #22543d; }
    .status-3 { background: #fed7d7; color: #742a2a; }

    .detail-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .info-card.full-width {
      grid-column: 1 / -1;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .card-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      font-weight: 600;
      color: #718096;
      font-size: 0.875rem;
    }

    .info-row .value {
      font-weight: 700;
      color: #1a202c;
      font-size: 1rem;
    }

    .activity-body {
      padding: 1.25rem;
    }

    .activity-duo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .activity-panel {
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 280px;
    }

    .farm-panel {
      background: linear-gradient(160deg, #ebf8ff 0%, #f0fff4 100%);
      border: 1px solid #bee3f8;
    }

    .training-panel {
      background: linear-gradient(160deg, #faf5ff 0%, #fffaf0 100%);
      border: 1px solid #d6bcfa;
    }

    .panel-top {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .panel-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .panel-icon.farm {
      background: #bee3f8;
      color: #2c5282;
    }

    .panel-icon.training {
      background: #c6f6d5;
      color: #22543d;
    }

    .panel-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 800;
      color: #1a202c;
    }

    .panel-subtitle {
      margin: 0.15rem 0 0;
      font-size: 0.8125rem;
      color: #718096;
    }

    .panel-metrics {
      display: flex;
      align-items: stretch;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .metric-hero {
      flex: 1;
      min-width: 120px;
      background: white;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .metric-hero-value {
      display: block;
      font-size: 2.25rem;
      font-weight: 800;
      color: #2c5282;
      line-height: 1;
    }

    .farm-panel .metric-hero-value {
      color: #2b6cb0;
    }

    .metric-hero-label {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #718096;
    }

    .metric-pill {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 12px;
      border: 1px solid rgba(44, 82, 130, 0.15);
    }

    .metric-pill-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #2d3748;
      line-height: 1;
    }

    .metric-pill-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #718096;
      margin-top: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .training-stats-row {
      display: flex;
      align-items: center;
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .training-stat {
      flex: 1;
      text-align: center;
    }

    .training-stat-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 800;
      color: #553c9a;
      line-height: 1;
    }

    .training-stat-label {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .training-stat-divider {
      width: 1px;
      height: 40px;
      background: #e2e8f0;
      flex-shrink: 0;
    }

    .training-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .cat-chip {
      padding: 0.25rem 0.65rem;
      border-radius: 50px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .cat-gap { background: #e9d8fd; color: #553c9a; }
    .cat-gep { background: #fed7d7; color: #742a2a; }
    .cat-gsp { background: #fef5e7; color: #975a16; }

    .panel-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 220px;
      overflow-y: auto;
    }

    .panel-list-item {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 10px;
      padding: 0.75rem 0.875rem;
      border: 1px solid rgba(0, 0, 0, 0.06);
    }

    .list-item-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .list-item-head strong {
      font-size: 0.875rem;
      color: #1a202c;
    }

    .list-item-meta {
      margin-top: 0.35rem;
      font-size: 0.75rem;
      color: #718096;
      line-height: 1.4;
    }

    .meta-dot {
      margin: 0 0.25rem;
    }

    .list-item-date {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #a0aec0;
    }

    .training-attendee-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #553c9a;
    }

    .panel-empty {
      margin: 0;
      font-size: 0.8125rem;
      color: #a0aec0;
      font-style: italic;
      padding: 0.5rem 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .stat-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #f7fafc;
      border-radius: 12px;
      transition: transform 0.3s;
    }

    .stat-box:hover {
      transform: translateY(-5px);
    }

    .stat-box.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-box.total .stat-value,
    .stat-box.total .stat-label {
      color: white;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.farmers { background: #bee3f8; color: #2c5282; }
    .stat-icon.training { background: #c6f6d5; color: #22543d; }
    .stat-icon.attendees { background: #feebc8; color: #7c2d12; }
    .stat-icon.gap { background: #e9d8fd; color: #553c9a; }
    .stat-icon.gep { background: #fed7d7; color: #742a2a; }
    .stat-icon.gsp { background: #fef5e7; color: #975a16; }
    .stat-icon.total-icon { background: white; color: #667eea; }

    .stat-letter {
      font-size: 0.875rem;
      font-weight: 800;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: #1a202c;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 600;
    }

    .rejection-card .card-header {
      background: #fed7d7;
      color: #742a2a;
    }

    .rejection-text {
      color: #742a2a;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
      padding: 1rem;
      background: #fff5f5;
      border-radius: 8px;
      border-left: 4px solid #fc8181;
    }

    @media (max-width: 768px) {
      .report-detail-container {
        padding: 1rem;
      }

      .detail-content {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .activity-duo {
        grid-template-columns: 1fr;
      }

      .training-stats-row {
        flex-wrap: wrap;
      }

      .training-stat-divider {
        display: none;
      }

      .training-stat {
        min-width: 30%;
      }
    }
  `]
})
export class ReportDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  report = signal<ReportDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  reportId = '';

  userRoleLabel = computed(() => {
    const report = this.report();
    const roleCode = (report?.role ?? this.authService.currentRole()) as UserRole | null;
    if (roleCode && roleCode in ROLE_LABELS) {
      return ROLE_LABELS[roleCode as UserRole];
    }
    return 'Field Officer';
  });

  farmersVisitedCount = computed(() => {
    const report = this.report();
    if (report?.farmersVisitedCount !== undefined) {
      return report.farmersVisitedCount;
    }
    return report?.farmerVisits?.length || 0;
  });

  trainingSessionsCount = computed(() => {
    const report = this.report();
    if (report?.trainingSessionsCount !== undefined) {
      return report.trainingSessionsCount;
    }
    return report?.trainingSessions?.length || 0;
  });

  trainingAttendeesCount = computed(() => {
    const report = this.report();
    if (report?.trainingAttendeesCount !== undefined) {
      return report.trainingAttendeesCount;
    }
    const sessions = report?.trainingSessions || [];
    return sessions.reduce((total, session) => total + (session.attendances?.length || 0), 0);
  });

  farmVisitsList = computed(() => this.report()?.farmerVisits ?? []);

  farmVisitsCount = computed(() => this.farmVisitsList().length);

  trainingSessionsList = computed(() => this.report()?.trainingSessions ?? []);

  avgAttendeesPerSession = computed(() => {
    const count = this.trainingSessionsCount();
    if (count === 0) return 0;
    return Math.round((this.trainingAttendeesCount() / count) * 10) / 10;
  });

  trainingCategorySummary = computed(() => {
    const counts = { gap: 0, gep: 0, gsp: 0 };
    for (const session of this.trainingSessionsList()) {
      const key = this.getCategoryKey(session.category);
      if (key === 'gap') counts.gap++;
      else if (key === 'gep') counts.gep++;
      else if (key === 'gsp') counts.gsp++;
    }
    return [
      { key: 'gap', label: 'GAP', count: counts.gap },
      { key: 'gep', label: 'GEP', count: counts.gep },
      { key: 'gsp', label: 'GSP', count: counts.gsp }
    ].filter(item => item.count > 0);
  });

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id') || '';
    if (this.reportId) {
      this.loadReport();
    } else {
      this.error.set('Invalid report ID');
      this.loading.set(false);
    }
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${environment.apiUrl}/api/Reports/${this.reportId}`).subscribe({
      next: (response) => {
        const raw = response?.data || response;
        this.report.set({
          ...raw,
          role: raw.role ?? raw.userRole ?? raw.Role ?? 'FO',
          farmerVisits: raw.farmerVisits ?? raw.FarmerVisits ?? [],
          trainingSessions: (raw.trainingSessions ?? raw.TrainingSessions ?? []).map((s: any) => ({
            ...s,
            attendances: s.attendances ?? s.Attendances ?? []
          })),
          farmersVisitedCount: raw.farmersVisitedCount ?? raw.farmersVisited ?? raw.FarmersVisited,
          trainingSessionsCount: raw.trainingSessionsCount ?? raw.TrainingSessionsCount,
          trainingAttendeesCount: raw.trainingAttendeesCount ?? raw.trainingAttendees ?? raw.TrainingAttendeesCount,
          gapCount: raw.gapTaskCount ?? raw.gapCount ?? raw.GapCount ?? 0,
          gepCount: raw.gepTaskCount ?? raw.gepCount ?? raw.GepCount ?? 0,
          gspCount: raw.gspTaskCount ?? raw.gspCount ?? raw.GspCount ?? 0,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load report details');
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  }

  formatDateRange(start: string, end: string): string {
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Under Review',
      2: 'Approved',
      3: 'Rejected'
    };
    return statusMap[status] ?? 'Unknown';
  }

  getStatusClass(status: number): string {
    return String(status);
  }

  getCategoryLabel(category: number | string | null | undefined): string {
    const n = Number(category);
    if (n === 1) return 'GAP';
    if (n === 2) return 'GEP';
    if (n === 3) return 'GSP';
    return String(category ?? '');
  }

  getCategoryKey(category: number | string | null | undefined): string {
    const n = Number(category);
    if (n === 1) return 'gap';
    if (n === 2) return 'gep';
    if (n === 3) return 'gsp';
    return 'gap';
  }

  getSessionAttendeeCount(session: TrainingSession): number {
    return session.attendances?.length ?? 0;
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  goBack(): void {
    this.router.navigate(['/fo/my-reports']);
  }
}
