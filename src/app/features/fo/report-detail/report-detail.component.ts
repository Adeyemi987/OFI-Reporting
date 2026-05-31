import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_LABELS, UserRole } from '../../../core/models';
import {
  getFoReportStatusClass,
  getFoReportStatusLabel,
  getFoDisplayStatus
} from '../../../core/utils/fo-report-status.util';

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
  tag?: string;
  farmerId?: string;
  farmerName: string;
  visitDate: string;
  location?: string;
  title?: string;
  topic?: string;
  category?: number;
  notes: string;
}

interface ReportDetail {
  reportId: string;
  userName: string;
  status: number | string;
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
        <nav class="detail-nav" aria-label="Report navigation">
          <button type="button" (click)="goBack()" class="btn-back">
            <span class="btn-back-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
              </svg>
            </span>
            <span class="btn-back-copy">
              <span class="btn-back-eyebrow">Return to list</span>
              <span class="btn-back-label">Back to Reports</span>
            </span>
          </button>
        </nav>

        <div class="detail-header hero-card">
          <div class="hero-accent"></div>

          <div class="hero-body">
            <div class="hero-top">
              <div class="hero-user">
                <div class="hero-avatar" aria-hidden="true">{{ userInitials() }}</div>
                <div class="hero-user-text">
                  <span class="hero-eyebrow">Submitted by</span>
                  <h2 class="hero-name">{{ report()!.userName }}</h2>
                  <span class="hero-role-chip">{{ userRoleLabel() }}</span>
                </div>
              </div>
              <span [class]="'status-badge status-' + getStatusClass(report()!.status)">
                {{ getStatusText(report()!.status) }}
              </span>
            </div>

            <div class="hero-divider"></div>

            <div class="hero-bottom">
              <div class="hero-week-display">
                <span class="hero-week-badge">W{{ report()!.weekNumber }}</span>
                <div>
                  <div class="hero-period-heading">
                    <span class="hero-duration-chip">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                      </svg>
                      {{ formatDateRange(report()!.weekStartDate, report()!.weekEndDate) }}
                    </span>
                    <span class="hero-period-sep" aria-hidden="true"></span>
                    <span class="hero-week-label">Reporting period</span>
                  </div>
                  <h1 class="hero-title">Week {{ report()!.weekNumber }}, {{ report()!.year }}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-content">
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
                  <div class="panel-metrics farm-metrics-card">
                    <div class="farm-metrics-stats">
                      <div class="metric-hero">
                        <span class="metric-hero-value">{{ farmVisitsCount() }}</span>
                        <span class="metric-hero-label">{{ farmVisitsCount() === 1 ? 'Visit' : 'Visits' }} recorded</span>
                      </div>
                      <div class="metric-pill">
                        <span class="metric-pill-value">{{ farmersVisitedCount() }}</span>
                        <span class="metric-pill-label">Farmers reached</span>
                      </div>
                    </div>
                  </div>
                  @if (farmVisitsList().length > 0) {
                    <div class="farmers-records-block">
                      <div class="farmers-section-header">
                        <span class="farmers-section-title">Farmer records</span>
                        <span class="farmers-section-count">{{ farmVisitsCount() }} {{ farmVisitsCount() === 1 ? 'farmer' : 'farmers' }}</span>
                      </div>
                      <div class="farmers-records-scroll" tabindex="0" role="region" aria-label="Farmer records list">
                        <ul class="panel-list farmers-records-list">
                          @for (visit of farmVisitsList(); track $index) {
                            <li class="panel-list-item farmer-record-item">
                              <span class="farmer-record-index" aria-hidden="true">{{ $index + 1 }}</span>
                              <div class="farmer-record-lines">
                                <div class="farmer-record-primary">
                                  <strong class="farmer-record-name">{{ visit.farmerName || 'Unknown farmer' }}</strong>
                                  @if (visit.farmerId || visit.tag) {
                                    <span class="farmer-chip">{{ visit.farmerId || visit.tag }}</span>
                                  }
                                  @if (visit.visitDate) {
                                    <span class="farmer-chip farmer-chip-date">{{ formatShortDate(visit.visitDate) }}</span>
                                  }
                                </div>
                                @if (getVisitTitle(visit)) {
                                  <p class="farmer-record-title" [title]="getVisitTitle(visit)">
                                    <span class="farmer-title-k">Title</span>
                                    <span class="farmer-title-v">{{ getVisitTitle(visit) }}</span>
                                  </p>
                                }
                              </div>
                            </li>
                          }
                        </ul>
                      </div>
                      @if (farmVisitsCount() > 8) {
                        <p class="farmers-scroll-hint">Scroll inside this section to view all farmers</p>
                      }
                    </div>
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

          @if (isReportRejected()) {
            <div class="info-card full-width rejection-card">
              <div class="card-header rejection-header">
                <div class="rejection-header-title">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  <h2>Rejection Reason</h2>
                </div>
                <button type="button" class="btn-resubmit" (click)="goToResubmit()">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                  Edit &amp; Resubmit
                </button>
              </div>
              <div class="card-body">
                @if (report()!.rejectionReason) {
                  <p class="rejection-text">{{ report()!.rejectionReason }}</p>
                } @else {
                  <p class="rejection-text rejection-text-muted">This report was rejected. Edit your data and resubmit for review.</p>
                }
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

    .detail-nav {
      margin-bottom: 1.25rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.625rem 1.25rem 0.625rem 0.625rem;
      background: rgba(255, 255, 255, 0.14);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }

    .btn-back:hover {
      background: rgba(255, 255, 255, 0.24);
      border-color: rgba(255, 255, 255, 0.45);
      transform: translateY(-2px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.18),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    .btn-back:active {
      transform: translateY(0);
    }

    .btn-back-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      color: #667eea;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
      transition: transform 0.25s ease;
    }

    .btn-back:hover .btn-back-icon {
      transform: translateX(-3px);
    }

    .btn-back-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.1rem;
      padding-right: 0.5rem;
    }

    .btn-back-eyebrow {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.72);
      line-height: 1;
    }

    .btn-back-label {
      font-size: 0.9375rem;
      font-weight: 700;
      color: white;
      line-height: 1.2;
    }

    .detail-header {
      background: white;
      border-radius: 20px;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      overflow: hidden;
      position: relative;
    }

    .hero-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
    }

    .hero-body {
      padding: 2rem;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .hero-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hero-avatar {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.375rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      flex-shrink: 0;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
    }

    .hero-user-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .hero-eyebrow {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #a0aec0;
    }

    .hero-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
      line-height: 1.2;
    }

    .hero-role-chip {
      display: inline-flex;
      align-self: flex-start;
      padding: 0.25rem 0.75rem;
      background: #edf2f7;
      color: #4a5568;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .hero-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
      margin: 1.5rem 0;
    }

    .hero-bottom {
      display: flex;
      flex-direction: column;
    }

    .hero-week-display {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hero-period-heading {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.625rem;
      margin-bottom: 0.375rem;
    }

    .hero-duration-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.28);
    }

    .hero-duration-chip svg {
      opacity: 0.9;
      flex-shrink: 0;
    }

    .hero-period-sep {
      width: 1px;
      height: 14px;
      background: #cbd5e0;
      flex-shrink: 0;
    }

    .hero-week-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ebf4ff 0%, #e9d8fd 100%);
      color: #553c9a;
      font-size: 1.125rem;
      font-weight: 800;
      flex-shrink: 0;
    }

    .hero-week-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #718096;
      margin: 0;
    }

    .hero-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
      line-height: 1.2;
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

    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-unknown { background: #f3f4f6; color: #4b5563; }

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
      min-height: 0;
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

    .farm-metrics-card {
      flex-direction: column;
      flex-wrap: nowrap;
      background: white;
      border-radius: 12px;
      padding: 1rem 1.125rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(44, 82, 130, 0.1);
      gap: 0;
    }

    .farm-metrics-stats {
      display: flex;
      align-items: stretch;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .farm-metrics-card .metric-hero {
      flex: 1;
      min-width: 100px;
      background: linear-gradient(135deg, #ebf8ff 0%, #f0fff4 100%);
      box-shadow: none;
      border: 1px solid rgba(44, 82, 130, 0.12);
    }

    .farm-metrics-card .metric-pill {
      flex: 1;
      min-width: 100px;
      background: rgba(235, 248, 255, 0.5);
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

    .farmers-records-block {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(44, 82, 130, 0.15);
      border-radius: 12px;
      overflow: hidden;
    }

    .farmers-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.875rem;
      background: rgba(255, 255, 255, 0.95);
      border-bottom: 1px solid rgba(44, 82, 130, 0.12);
      flex-shrink: 0;
    }

    .farmers-section-title {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.45px;
      color: #4a5568;
    }

    .farmers-section-count {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 50px;
      background: #ebf8ff;
      color: #2c5282;
      border: 1px solid rgba(44, 82, 130, 0.15);
    }

    .farmers-records-scroll {
      position: relative;
      max-height: min(280px, 36vh);
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.25rem 0.5rem 0.5rem;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }

    .farmers-records-scroll::after {
      content: '';
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      display: block;
      height: 1.25rem;
      margin-top: -1.25rem;
      pointer-events: none;
      background: linear-gradient(to bottom, transparent, rgba(235, 248, 255, 0.95));
    }

    .farmers-records-scroll:focus {
      outline: 2px solid rgba(44, 82, 130, 0.35);
      outline-offset: -2px;
    }

    .farmers-records-scroll::-webkit-scrollbar {
      width: 6px;
    }

    .farmers-records-scroll::-webkit-scrollbar-track {
      background: rgba(44, 82, 130, 0.06);
      border-radius: 3px;
    }

    .farmers-records-scroll::-webkit-scrollbar-thumb {
      background: rgba(44, 82, 130, 0.28);
      border-radius: 3px;
    }

    .farmers-records-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(44, 82, 130, 0.45);
    }

    .farmers-records-list {
      max-height: none;
      overflow: visible;
      gap: 0;
    }

    .farmers-records-list .farmer-record-item {
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(44, 82, 130, 0.08);
      border-radius: 0;
      padding: 0.45rem 0.375rem;
    }

    .farmer-record-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .farmer-record-item:last-child {
      border-bottom: none;
    }

    .farmer-record-item:hover {
      background: rgba(235, 248, 255, 0.55);
    }

    .farmer-record-index {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 6px;
      background: rgba(44, 82, 130, 0.08);
      color: #2c5282;
      font-size: 0.625rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.1rem;
    }

    .farmer-record-lines {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .farmer-record-primary {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      min-width: 0;
    }

    .farmer-record-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #1a202c;
      line-height: 1.25;
    }

    .farmer-chip {
      display: inline-flex;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      background: rgba(44, 82, 130, 0.07);
      color: #4a5568;
      font-size: 0.625rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .farmer-chip-date {
      background: rgba(102, 126, 234, 0.1);
      color: #553c9a;
    }

    .farmer-record-title {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      margin: 0;
      min-width: 0;
      line-height: 1.3;
    }

    .farmer-title-k {
      flex-shrink: 0;
      font-size: 0.5625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a0aec0;
    }

    .farmer-title-v {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #553c9a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .farmers-scroll-hint {
      margin: 0;
      padding: 0.4rem 0.875rem 0.55rem;
      font-size: 0.6875rem;
      color: #718096;
      text-align: center;
      background: rgba(255, 255, 255, 0.85);
      border-top: 1px dashed rgba(44, 82, 130, 0.15);
      flex-shrink: 0;
    }

    .meta-tag {
      font-weight: 600;
      color: #4a5568;
    }

    .list-item-notes {
      margin: 0.5rem 0 0;
      font-size: 0.8125rem;
      line-height: 1.45;
      color: #718096;
      font-style: italic;
    }

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

    .rejection-header {
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .rejection-header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-resubmit {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      background: white;
      color: #991b1b;
      border: 1.5px solid rgba(153, 27, 27, 0.25);
      border-radius: 10px;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(153, 27, 27, 0.12);
    }

    .btn-resubmit:hover {
      background: #fff5f5;
      border-color: #f87171;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(153, 27, 27, 0.18);
    }

    .rejection-text-muted {
      font-style: italic;
      opacity: 0.9;
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

      .detail-nav {
        margin-bottom: 1rem;
      }

      .btn-back-copy {
        padding-right: 0.25rem;
      }

      .btn-back-label {
        font-size: 0.875rem;
      }

      .detail-content {
        grid-template-columns: 1fr;
      }

      .hero-top {
        flex-direction: column;
      }

      .hero-title {
        font-size: 1.375rem;
      }

      .hero-period-heading {
        gap: 0.5rem;
      }

      .hero-duration-chip {
        font-size: 0.6875rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .activity-duo {
        grid-template-columns: 1fr;
      }

      .farmers-records-scroll {
        max-height: min(200px, 28vh);
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

  userInitials = computed(() => {
    const name = this.report()?.userName?.trim() || '';
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  farmVisitSharedTitle = computed(() => {
    const visits = this.farmVisitsList();
    if (visits.length === 0) return '';
    const first = visits[0];
    return (first.title || first.topic || '').trim();
  });

  getVisitTitle(visit: FarmerVisit): string {
    const ownTitle = (visit.title || visit.topic || '').trim();
    if (ownTitle) return ownTitle;
    return this.farmVisitSharedTitle();
  }

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

  getStatusText(status: number | string): string {
    return getFoReportStatusLabel(status);
  }

  getStatusClass(status: number | string): string {
    return getFoReportStatusClass(status);
  }

  getCategoryLabel(category: number | string | null | undefined): string {
    const n = Number(category);
    if (n === 0) return 'GAP';
    if (n === 1) return 'GEP';
    if (n === 2) return 'GSP';
    if (typeof category === 'string' && ['GAP', 'GEP', 'GSP'].includes(category)) {
      return category;
    }
    return '';
  }

  getCategoryKey(category: number | string | null | undefined): string {
    const label = this.getCategoryLabel(category);
    if (label === 'GEP') return 'gep';
    if (label === 'GSP') return 'gsp';
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

  isReportRejected(): boolean {
    return getFoDisplayStatus(this.report()?.status) === 'rejected';
  }

  goToResubmit(): void {
    if (!this.reportId) return;
    this.router.navigate(['/fo/resubmit-report', this.reportId]);
  }
}
