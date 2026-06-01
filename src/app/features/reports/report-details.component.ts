import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { API_BASE_URL } from '../../core/tokens';

interface ReportEvidence {
  id: string;
  originalFileName: string;
  evidenceType?: string;
  uploadedAt?: string;
  downloadUrl?: string;
  contentType?: string;
}

interface ReportFarmerVisit {
  id: string;
  title: string;
  farmerName: string;
  tag: string;
  visitDate: string;
  notes: string;
}

@Component({
  selector: 'app-report-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1A1A1A; min-height: 100%; padding: 32px 24px;
    ">
      <!-- Back Button -->
      <button
        (click)="goBack()"
        style="
          display: inline-flex; align-items: center; gap: 6px;
          margin-bottom: 24px; padding: 10px 18px;
          background: #F0B8E0; color: #8B2D73; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; font-size: 14px;
        "
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Back to Reports
      </button>

      <!-- Error State -->
      @if (error()) {
        <div style="
          background: #FEE2E2; border: 1px solid #FECACA;
          border-radius: 12px; padding: 16px; margin-bottom: 24px;
          color: #DC2626; font-size: 14px;
        ">
          {{ error() }}
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div style="
          background: white; border-radius: 20px; padding: 48px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center;
        ">
          <svg style="animation: spin 1s linear infinite; display: inline-block; margin-bottom: 16px;" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(208,71,174,0.25)" stroke-width="3"/>
            <path d="M12 2a10 10 0 0110 10" stroke="#D047AE" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #9CA3AF;">Loading report details...</p>
        </div>
      }

      @if (!loading() && details(); as record) {
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #8B2D73 0%, #D047AE 50%, #D960BA 100%);
          border-radius: 20px; padding: 28px 32px; margin-bottom: 28px;
          box-shadow: 0 8px 28px rgba(208,71,174,0.25);
          color: white;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="
              width: 56px; height: 56px; border-radius: 14px;
              background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
              display: flex; align-items: center; justify-content: center;
              font-size: 20px; font-weight: 800;
            ">
              {{ getInitials(record.fullName) }}
            </div>
            <div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">{{ record.fullName }}</h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">{{ record.role }}</p>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px;">
          <div style="background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #F3F4F6;">
            <div style="font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px;">Farmers Visited</div>
            <div style="font-size: 28px; font-weight: 800; color: #D047AE;">{{ record.farmersVisited }}</div>
          </div>
          <div style="background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #F3F4F6;">
            <div style="font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px;">Evidence</div>
            <div style="font-size: 28px; font-weight: 800; color: #D97706;">{{ record.evidences?.length ?? 0 }}</div>
          </div>
        </div>

        <!-- Tabbed Interface -->
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 24px;">
          <!-- Tab Buttons -->
          <div style="
            display: flex; gap: 0; border-bottom: 2px solid #F3F4F6;
            background: #F8FAFC; padding: 0;
          ">
            <button
              (click)="activeTab.set('evidence')"
              [style.background]="activeTab() === 'evidence' ? 'white' : 'transparent'"
              [style.border-bottom]="activeTab() === 'evidence' ? '3px solid #D047AE' : 'none'"
              [style.color]="activeTab() === 'evidence' ? '#8B2D73' : '#9CA3AF'"
              [style.font-weight]="activeTab() === 'evidence' ? '700' : '500'"
              style="
                padding: 16px 24px; cursor: pointer; border: none;
                transition: all 0.2s; font-size: 14px; white-space: nowrap;
              "
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display: inline; margin-right: 8px; vertical-align: middle;">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
              </svg>
              Evidence
            </button>
            <button
              (click)="activeTab.set('training')"
              [style.background]="activeTab() === 'training' ? 'white' : 'transparent'"
              [style.border-bottom]="activeTab() === 'training' ? '3px solid #D047AE' : 'none'"
              [style.color]="activeTab() === 'training' ? '#8B2D73' : '#9CA3AF'"
              [style.font-weight]="activeTab() === 'training' ? '700' : '500'"
              style="
                padding: 16px 24px; cursor: pointer; border: none;
                transition: all 0.2s; font-size: 14px; white-space: nowrap;
              "
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display: inline; margin-right: 8px; vertical-align: middle;">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              Training Sessions
            </button>
            <button
              (click)="activeTab.set('farm-visits')"
              [style.background]="activeTab() === 'farm-visits' ? 'white' : 'transparent'"
              [style.border-bottom]="activeTab() === 'farm-visits' ? '3px solid #D047AE' : 'none'"
              [style.color]="activeTab() === 'farm-visits' ? '#8B2D73' : '#9CA3AF'"
              [style.font-weight]="activeTab() === 'farm-visits' ? '700' : '500'"
              style="
                padding: 16px 24px; cursor: pointer; border: none;
                transition: all 0.2s; font-size: 14px; white-space: nowrap;
              "
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display: inline; margin-right: 8px; vertical-align: middle;">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              Farm Visits
            </button>
          </div>

          <!-- Tab Content: Evidence -->
          @if (activeTab() === 'evidence') {
            <div style="padding: 24px;">
              @if (record.evidences && record.evidences.length > 0) {
                <p style="margin: 0 0 14px; font-size: 12px; color: #9CA3AF; display: flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  Click a preview thumbnail to view the full image
                </p>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Preview</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">File Name</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Type</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (evidence of record.evidences; track evidence.id) {
                        <tr style="border-bottom: 1px solid #F3F4F6;">
                          <td style="padding: 12px 16px;">
                            @if (getEvidencePreviewUrl(evidence.id)) {
                              <button
                                type="button"
                                class="evidence-thumb-btn"
                                (click)="openEnlargedEvidence(evidence)"
                                [attr.aria-label]="'View full image: ' + evidence.originalFileName"
                                title="Click to enlarge"
                              >
                                <img
                                  [src]="getEvidencePreviewUrl(evidence.id)!"
                                  [alt]="evidence.originalFileName"
                                />
                                <span class="evidence-thumb-overlay" aria-hidden="true">
                                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l4.293 4.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm13 12a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-4.293-4.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 112 0v4z" clip-rule="evenodd"/>
                                  </svg>
                                </span>
                              </button>
                            } @else {
                              <div style="
                                width: 56px; height: 56px; border-radius: 8px;
                                background: #F3F4F6; display: flex; align-items: center; justify-content: center; color: #9CA3AF;
                              ">
                                <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                                </svg>
                              </div>
                            }
                          </td>
                          <td style="padding: 12px 16px; font-weight: 600;">{{ evidence.originalFileName }}</td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">{{ evidence.evidenceType ?? '—' }}</td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">
                            {{ evidence.uploadedAt ? (evidence.uploadedAt | date:'MMM d, y') : '—' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div style="padding: 32px; text-align: center; color: #9CA3AF;">
                  <p style="margin: 0; font-size: 14px;">No evidence uploaded for this report.</p>
                </div>
              }
            </div>
          }

          <!-- Tab Content: Training Sessions -->
          @if (activeTab() === 'training') {
            <div style="padding: 24px;">
              @if (record.trainingSessions && record.trainingSessions.length > 0) {
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Title</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Location</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Category</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Session Date</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Attendees</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (training of record.trainingSessions; track training.id) {
                        <tr style="border-bottom: 1px solid #F3F4F6;">
                          <td style="padding: 12px 16px; font-weight: 600;">{{ training.title }}</td>
                          <td style="padding: 12px 16px; color: #6B7280;">{{ training.location }}</td>
                          <td style="padding: 12px 16px; text-align: center;">
                            <span [style]="getCategoryStyle(training.category)">{{ mapCategory(training.category) }}</span>
                          </td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">
                            {{ training.sessionDate ? (training.sessionDate | date:'MMM d, y') : '—' }}
                          </td>
                          <td style="padding: 12px 16px; text-align: center; color: #D047AE; font-weight: 700;">
                            {{ training.attendances ? training.attendances.length : 0 }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div style="padding: 32px; text-align: center; color: #9CA3AF;">
                  <p style="margin: 0; font-size: 14px;">No training sessions recorded for this period.</p>
                </div>
              }
            </div>
          }

          <!-- Tab Content: Farm Visits -->
          @if (activeTab() === 'farm-visits') {
            <div style="padding: 24px;">
              @if (record.farmerVisits && record.farmerVisits.length > 0) {
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Title</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Farmer Name</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Tag</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Visit Date</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (visit of record.farmerVisits; track visit.id) {
                        <tr style="border-bottom: 1px solid #F3F4F6;">
                          <td style="padding: 12px 16px; font-weight: 600;">{{ visit.title || '—' }}</td>
                          <td style="padding: 12px 16px; font-weight: 600;">{{ visit.farmerName || '—' }}</td>
                          <td style="padding: 12px 16px; text-align: center;">
                            @if (visit.tag) {
                              <span style="
                                display: inline-block; padding: 3px 10px; border-radius: 999px;
                                background: #FDF2FB; color: #8B2D73; font-size: 11px; font-weight: 700;
                              ">{{ visit.tag }}</span>
                            } @else {
                              <span style="color: #9CA3AF;">—</span>
                            }
                          </td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">
                            {{ visit.visitDate ? (visit.visitDate | date:'MMM d, y') : '—' }}
                          </td>
                          <td style="padding: 12px 16px; color: #9CA3AF; font-size: 12px;">{{ visit.notes || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div style="padding: 32px; text-align: center; color: #9CA3AF;">
                  <p style="margin: 0; font-size: 14px;">No farm visits recorded for this period.</p>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (!loading() && !details()) {
        <div style="
          background: white; border-radius: 20px; padding: 48px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center;
        ">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #9CA3AF;">No report details available.</p>
        </div>
      }

      @if (enlargedEvidence()) {
        <div
          class="evidence-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged evidence image"
          (click)="closeEnlargedEvidence()"
          style="
            position: fixed; inset: 0; z-index: 1200;
            background: rgba(17, 24, 39, 0.82);
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
          "
        >
          <div
            (click)="$event.stopPropagation()"
            style="
              position: relative; max-width: min(920px, 96vw); max-height: 92vh;
              background: white; border-radius: 16px; overflow: hidden;
              box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
              display: flex; flex-direction: column;
            "
          >
            <div style="
              display: flex; align-items: center; justify-content: space-between; gap: 12px;
              padding: 14px 16px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA;
            ">
              <span style="font-size: 13px; font-weight: 700; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ enlargedEvidence()!.fileName }}
              </span>
              <button
                type="button"
                (click)="closeEnlargedEvidence()"
                aria-label="Close enlarged image"
                style="
                  width: 32px; height: 32px; border: none; border-radius: 8px;
                  background: #FEE2E2; color: #DC2626; cursor: pointer;
                  display: inline-flex; align-items: center; justify-content: center;
                "
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
            <div style="padding: 16px; background: #111827; display: flex; align-items: center; justify-content: center;">
              <img
                [src]="enlargedEvidence()!.url"
                [alt]="enlargedEvidence()!.fileName"
                style="max-width: 100%; max-height: calc(92vh - 120px); object-fit: contain; border-radius: 8px;"
              />
            </div>
          </div>
        </div>
      }

      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .evidence-thumb-btn {
          position: relative;
          display: inline-block;
          padding: 0;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          background: none;
          cursor: zoom-in;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .evidence-thumb-btn:hover,
        .evidence-thumb-btn:focus-visible {
          border-color: #D047AE;
          box-shadow: 0 4px 14px rgba(208, 71, 174, 0.28);
          transform: scale(1.04);
          outline: none;
        }
        .evidence-thumb-btn img {
          display: block;
          width: 64px;
          height: 64px;
          object-fit: cover;
        }
        .evidence-thumb-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(17, 24, 39, 0.5);
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .evidence-thumb-btn:hover .evidence-thumb-overlay,
        .evidence-thumb-btn:focus-visible .evidence-thumb-overlay {
          opacity: 1;
        }
      </style>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDetailsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  details = signal<any>(null);
  activeTab = signal<'evidence' | 'training' | 'farm-visits'>('evidence');
  loading = signal(true);
  error = signal<string | null>(null);
  evidencePreviewUrls = signal<Record<string, string>>({});
  enlargedEvidence = signal<{ url: string; fileName: string } | null>(null);
  private previewObjectUrls: string[] = [];

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeEnlargedEvidence();
  }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.goBack();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    this.dashboardService.getReportDetails(userId).subscribe({
      next: (response: any) => {
        console.log('[ReportDetails] Component received:', response);
        // Handle both { success, data } wrapper and direct data object
        const payload = response?.data ?? response;
        if (payload) {
          // Normalize field names (API may return PascalCase from .NET)
          const normalized = {
            fullName: payload.fullName ?? payload.FullName ?? payload.userName ?? payload.UserName,
            role: payload.role ?? payload.Role,
            farmersVisited: payload.totalFarmersVisited ?? payload.farmersVisited ?? payload.FarmersVisited ?? 0,
            evidences: this.normalizeEvidences(payload.evidences ?? payload.Evidences ?? []),
            trainingSessions: payload.trainingSessions ?? payload.TrainingSessions ?? [],
            farmerVisits: this.normalizeFarmerVisits(
              payload.farmerVisits ?? payload.FarmerVisits ?? payload.farmVisits ?? payload.FarmVisits ?? []
            ),
          };
          console.log('[ReportDetails] Normalized payload:', normalized);
          this.details.set(normalized);
          this.loadEvidencePreviews(normalized.evidences);
          this.error.set(null);
        } else {
          this.error.set('Failed to load report details');
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading report details:', err);
        this.error.set('Error loading report details. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private readonly CATEGORY_MAP: Record<number | string, string> = {
    0: 'GAP', 1: 'GEP', 2: 'GSP',
    GAP: 'GAP', GEP: 'GEP', GSP: 'GSP'
  };

  mapCategory(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return 'Unknown';
    return this.CATEGORY_MAP[value] ?? 'Unknown';
  }

  getCategoryStyle(category: number | string | null | undefined): Record<string, string> {
    const label = this.mapCategory(category);
    const styles: Record<string, Record<string, string>> = {
      GAP: { 'background': '#DCFCE7', 'color': '#16A34A', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' },
      GEP: { 'background': '#E0F2FE', 'color': '#0284C7', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' },
      GSP: { 'background': '#EDE9FE', 'color': '#7C3AED', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' },
      Unknown: { 'background': '#F3F4F6', 'color': '#6B7280', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' }
    };
    return styles[label] ?? styles['Unknown'];
  }

  ngOnDestroy(): void {
    this.enlargedEvidence.set(null);
    this.previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewObjectUrls = [];
  }

  getEvidencePreviewUrl(evidenceId: string): string | null {
    return this.evidencePreviewUrls()[evidenceId] ?? null;
  }

  openEnlargedEvidence(evidence: ReportEvidence): void {
    const url = this.getEvidencePreviewUrl(evidence.id);
    if (!url) return;
    this.enlargedEvidence.set({
      url,
      fileName: evidence.originalFileName
    });
  }

  closeEnlargedEvidence(): void {
    this.enlargedEvidence.set(null);
  }

  private normalizeFarmerVisits(raw: unknown[]): ReportFarmerVisit[] {
    return raw.map((item: any, index: number) => ({
      id: item.id ?? item.Id ?? `visit-${index}`,
      title: item.title ?? item.Title ?? item.topic ?? item.Topic ?? '',
      farmerName: item.farmerName ?? item.FarmerName ?? '',
      tag: item.farmerId ?? item.FarmerId ?? item.tag ?? item.Tag ?? '',
      visitDate: item.visitDate ?? item.VisitDate ?? '',
      notes: item.notes ?? item.Notes ?? ''
    }));
  }

  private normalizeEvidences(raw: unknown[]): ReportEvidence[] {
    return raw.map((item: any) => ({
      id: item.id ?? item.Id ?? '',
      originalFileName: item.originalFileName ?? item.OriginalFileName ?? 'Evidence file',
      evidenceType: item.evidenceType ?? item.EvidenceType,
      uploadedAt: item.uploadedAt ?? item.UploadedAt,
      downloadUrl: item.downloadUrl ?? item.DownloadUrl,
      contentType: item.contentType ?? item.ContentType
    }));
  }

  private loadEvidencePreviews(evidences: ReportEvidence[]): void {
    evidences.forEach(evidence => {
      if (!evidence.downloadUrl || !evidence.id) return;
      const url = evidence.downloadUrl.startsWith('http')
        ? evidence.downloadUrl
        : `${this.baseUrl}${evidence.downloadUrl}`;

      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.previewObjectUrls.push(objectUrl);
          this.evidencePreviewUrls.update(current => ({
            ...current,
            [evidence.id]: objectUrl
          }));
        }
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/reports']);
  }
}
