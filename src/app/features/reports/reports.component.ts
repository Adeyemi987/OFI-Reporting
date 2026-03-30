import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary, SubordinateReport, ROLE_LABELS, ROLE_SUBORDINATE } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1A1A1A; min-height: 100%;
      animation: pageSlideIn 0.5s cubic-bezier(0.4,0,0.2,1);
    ">

      <!-- ── Hero Header ──────────────────────────────────────────── -->
      <div style="
        background: linear-gradient(135deg, #8B2D73 0%, #D047AE 50%, #D960BA 100%);
        border-radius: 24px; padding: 32px 36px; margin-bottom: 28px;
        position: relative; overflow: hidden;
        box-shadow: 0 12px 40px rgba(208,71,174,0.35);
      ">
        <div style="position:absolute;top:-60px;right:-60px;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
        <div style="position:absolute;bottom:-80px;left:40%;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="padding:5px 14px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:30px;font-size:12px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase;">{{ role() }}</span>
            <span style="color:rgba(255,255,255,0.7);font-size:13px;">{{ roleLabel() }}</span>
          </div>
          <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Detailed Reports</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Farm visit &amp; training details for {{ subordinateLabel() }} · Click any row to expand</p>
        </div>
      </div>

      @if (loading()) {
        <div style="display:grid;grid-template-columns:1fr;gap:20px;">
          @for (i of [1,2,3]; track i) {
            <div style="background:white;border-radius:20px;padding:28px;height:80px;animation:shimmer 1.5s infinite;background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;"></div>
          }
        </div>
      } @else {

        <!-- ── Direction Hint ───────────────────────────────────────── -->
        <div style="
          display:flex;align-items:center;gap:14px;
          padding:14px 20px;margin-bottom:20px;
          background:linear-gradient(135deg,#FDF2FB,#FADDF2);
          border:1.5px solid #F0B8E0;border-radius:14px;
        ">
          <div style="
            width:36px;height:36px;border-radius:10px;flex-shrink:0;
            background:linear-gradient(135deg,#D047AE,#E068C4);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 3px 10px rgba(208,71,174,0.25);
          ">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#8B2D73;">How to view details</div>
            <div style="font-size:12px;color:#C2389A;margin-top:2px;">Click on any record below to expand and view their detailed <strong>Task</strong> and <strong>Training</strong> information. Use the category filter inside each expanded view to narrow results.</div>
          </div>
        </div>

        <!-- ── Subordinate Detail Table ──────────────────────────────── -->
        <div style="
          background:white; border-radius:20px; overflow:hidden;
          box-shadow:0 4px 24px rgba(0,0,0,0.08); border:1px solid #F3F4F6;
        ">
          <!-- Table Header -->
          <div style="
            padding:18px 24px; border-bottom:1px solid #F3F4F6;
            display:flex; align-items:center; justify-content:space-between;
          ">
            <div>
              <h2 style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;">{{ subordinateLabel() }} Details</h2>
              <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">{{ filteredSubordinates().length }} records · Click any row to expand task &amp; training details</p>
            </div>
            <div style="
              padding:6px 12px; background:#DCFCE7; border:1px solid #BBF7D0;
              border-radius:20px; font-size:12px; font-weight:700; color:#16A34A;
            ">{{ summary()?.approvedCount ?? 0 }}/{{ summary()?.totalSubordinates ?? 0 }} Approved</div>
          </div>

          <!-- Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#F8FAFC;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">
                    <svg style="display:inline;margin-right:4px;vertical-align:middle;" width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Full Name</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Farmers</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#228A22;text-transform:uppercase;letter-spacing:0.5px;">GAP</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#0EA5E9;text-transform:uppercase;letter-spacing:0.5px;">GEP</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#8B5CF6;text-transform:uppercase;letter-spacing:0.5px;">GSP</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;min-width:200px;">Status / Action</th>
                </tr>
              </thead>
              <tbody>
                @for (sub of filteredSubordinates(); track sub.userId; let i = $index) {
                  <!-- Main row -->
                  <tr
                    (click)="toggleExpand(sub)"
                    class="table-row-hover"
                    [style]="rowStyle(sub, i)"
                  >
                    <td style="padding:14px 16px;">
                      <div style="
                        width:22px;height:22px;border-radius:6px;
                        background:#F3F4F6;display:flex;align-items:center;justify-content:center;
                        transition:transform 0.2s;
                      " [style.transform]="sub.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#6B7280">
                          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                    </td>
                    <td style="padding:14px 16px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div style="
                          width:34px;height:34px;border-radius:10px;flex-shrink:0;
                          background:linear-gradient(135deg,#D047AE,#E068C4);
                          display:flex;align-items:center;justify-content:center;
                          font-size:12px;font-weight:800;color:white;
                        ">{{ getInitials(sub.fullName) }}</div>
                        <div>
                          <div style="font-size:14px;font-weight:700;color:#1A1A1A;">{{ sub.fullName }}</div>
                          <div style="font-size:11px;color:#9CA3AF;margin-top:1px;">{{ sub.role }}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:15px;font-weight:800;color:#D047AE;
                        background:#FDF2FB;padding:3px 10px;border-radius:8px;
                      ">{{ sub.farmersVisited }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:14px;font-weight:700;color:#C2389A;
                        background:#FADDF2;padding:3px 10px;border-radius:8px;
                      ">{{ sub.gapCount }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:14px;font-weight:700;color:#0284C7;
                        background:#E0F2FE;padding:3px 10px;border-radius:8px;
                      ">{{ sub.gepCount }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:14px;font-weight:700;color:#7C3AED;
                        background:#EDE9FE;padding:3px 10px;border-radius:8px;
                      ">{{ sub.gspCount }}</span>
                    </td>
                    <!-- Multipurpose Status / Action cell -->
                    <td style="padding:10px 16px;text-align:center;" (click)="$event.stopPropagation()">
                      @if (sub.status === 'approved') {
                        <span style="
                          display:inline-flex;align-items:center;gap:5px;
                          padding:7px 14px;background:#DCFCE7;color:#16A34A;
                          border-radius:20px;font-size:11px;font-weight:800;
                          white-space:nowrap;border:1.5px solid #BBF7D0;
                          pointer-events:none;
                        ">
                          <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                          Approved
                          <svg width="9" height="9" viewBox="0 0 20 20" fill="currentColor" style="opacity:0.45;"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                        </span>
                      } @else if (sub.status === 'rejected') {
                        <span style="
                          display:inline-flex;align-items:center;gap:5px;
                          padding:7px 14px;background:#FEE2E2;color:#DC2626;
                          border-radius:20px;font-size:11px;font-weight:800;
                          white-space:nowrap;border:1.5px solid #FECACA;
                          pointer-events:none;
                        ">
                          <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                          Rejected
                          <svg width="9" height="9" viewBox="0 0 20 20" fill="currentColor" style="opacity:0.45;"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                        </span>
                      } @else if (actioningSubId() === sub.userId) {
                        <span style="
                          display:inline-flex;align-items:center;gap:6px;
                          padding:7px 14px;background:#FEF9C3;color:#B45309;
                          border-radius:20px;font-size:11px;font-weight:700;
                          white-space:nowrap;border:1.5px solid #FDE68A;
                        ">
                          <svg style="animation:spin 1s linear infinite;" width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(180,83,9,0.25)" stroke-width="3"/>
                            <path d="M12 2a10 10 0 0110 10" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
                          </svg>
                          Processing...
                        </span>
                      } @else {
                        <!-- Pending: two-part widget — status badge above, action dropdown below -->
                        <div style="display:inline-flex;flex-direction:column;align-items:center;gap:5px;">
                          <!-- Status indicator -->
                          <span style="
                            display:inline-flex;align-items:center;gap:4px;
                            padding:3px 10px;
                            background:#FEF9C3;color:#B45309;
                            border-radius:20px;font-size:10px;font-weight:800;
                            border:1.5px solid #FDE68A;white-space:nowrap;
                          ">
                            <span style="width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block;"></span>
                            Pending
                          </span>
                          <!-- Action prompt -->
                          <div style="position:relative;display:inline-block;">
                            <select
                              class="status-action-select"
                              (change)="onActionSelect($event, sub)"
                              style="
                                appearance:none;-webkit-appearance:none;
                                padding:5px 26px 5px 10px;
                                border-radius:8px;
                                border:1.5px dashed #D047AE;
                                background:white;
                                color:#8B2D73;
                                font-size:11px;font-weight:700;
                                cursor:pointer;outline:none;
                                min-width:130px;
                                transition:border-color 0.2s,box-shadow 0.2s,background 0.2s;
                              "
                            >
                              <option value="" disabled selected>👆 Choose action…</option>
                              <option value="approve">✓ Approve</option>
                              <option value="reject">✕ Reject</option>
                            </select>
                            <svg style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;" width="10" height="10" viewBox="0 0 20 20" fill="#D047AE">
                              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                      }
                    </td>
                  </tr>

                  <!-- Expanded detail row -->
                  @if (sub.isExpanded) {
                    <tr style="animation: expandRow 0.3s ease-out;">
                      <td colspan="7" style="background:#FDF2FB;border-top:1px solid #F0B8E0;border-bottom:2px solid #E068C4;">
                        <div style="padding:20px 24px;">

                          <!-- Tabs + Category Filter -->
                          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">
                            <div style="display:flex;gap:8px;">
                              @for (tab of ['Tasks', 'Training']; track tab) {
                                <button
                                  (click)="setActiveTab(sub.userId, tab); $event.stopPropagation()"
                                  [style]="tabStyle(sub.userId, tab)"
                                >{{ tab }}</button>
                              }
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;" (click)="$event.stopPropagation()">
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="#C2389A"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/></svg>
                              <select
                                [ngModel]="getExpandCategoryFilter(sub.userId)"
                                (ngModelChange)="setExpandCategoryFilter(sub.userId, $event)"
                                style="
                                  padding:5px 10px;border:1.5px solid #F0B8E0;border-radius:8px;
                                  font-size:12px;font-weight:600;color:#8B2D73;
                                  background:white;outline:none;cursor:pointer;
                                "
                              >
                                <option value="">All Categories</option>
                                <option value="GAP">GAP</option>
                                <option value="GEP">GEP</option>
                                <option value="GSP">GSP</option>
                              </select>
                            </div>
                          </div>

                          <!-- Tasks Tab -->
                          @if (getActiveTab(sub.userId) === 'Tasks') {
                            <div style="overflow-x:auto;">
                              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                                <thead>
                                  <tr style="background:rgba(208,71,174,0.06);">
                                    <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#374151;">Task</th>
                                    <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#374151;">Category</th>
                                    <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#374151;">Farmers</th>
                                    <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#374151;">Location</th>
                                    <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#374151;">Date</th>
                                    <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#374151;">Observation/Recommendation</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (task of filteredTasks(sub); track task.id) {
                                    <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                                      <td style="padding:9px 14px;font-weight:600;color:#1A1A1A;">{{ task.title }}</td>
                                      <td style="padding:9px 14px;text-align:center;">
                                        <span [style]="categoryBadge(task.category)">{{ task.category }}</span>
                                      </td>
                                      <td style="padding:9px 14px;text-align:center;font-weight:700;color:#D047AE;">{{ task.farmersVisited }}</td>
                                      <td style="padding:9px 14px;color:#6B7280;">{{ task.location }}</td>
                                      <td style="padding:9px 14px;text-align:center;color:#6B7280;">{{ task.completedDate | date:'MMM d, y' }}</td>
                                      <td style="padding:9px 14px;color:#9CA3AF;font-size:12px;">{{ task.notes ?? '—' }}</td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          }

                          <!-- Training Tab -->
                          @if (getActiveTab(sub.userId) === 'Training') {
                            <div style="overflow-x:auto;">
                              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                                <thead>
                                  <tr style="background:rgba(208,71,174,0.06);">
                                    <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#374151;">Training Title</th>
                                    <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#374151;">Category</th>
                                    <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#374151;">Participants</th>
                                    <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#374151;">Name of Community</th>
                                    <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#374151;">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (ts of filteredTraining(sub); track ts.id) {
                                    <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                                      <td style="padding:9px 14px;font-weight:600;color:#1A1A1A;">{{ ts.title }}</td>
                                      <td style="padding:9px 14px;text-align:center;">
                                        <span [style]="categoryBadge(ts.category)">{{ ts.category }}</span>
                                      </td>
                                      <td style="padding:9px 14px;text-align:center;font-weight:700;color:#D047AE;">{{ ts.participants }}</td>
                                      <td style="padding:9px 14px;color:#6B7280;">{{ ts.location }}</td>
                                      <td style="padding:9px 14px;text-align:center;color:#6B7280;">{{ ts.date | date:'MMM d, y' }}</td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          @if (filteredSubordinates().length === 0) {
            <div style="padding:48px;text-align:center;color:#9CA3AF;">
              <svg width="48" height="48" viewBox="0 0 20 20" fill="#E5E7EB" style="display:block;margin:0 auto 12px;">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
              <p style="margin:0;font-size:14px;">No records match your filters.</p>
            </div>
          }
        </div>
      }

      <!-- ── Confirm Approve Modal ───────────────────────────────── -->
      @if (approveModal()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;" (click)="closeApproveModal()">
          <div style="background:white;border-radius:20px;padding:32px;width:100%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,0.3);" (click)="$event.stopPropagation()">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
              <div style="width:44px;height:44px;border-radius:12px;background:#DCFCE7;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;">Confirm Approval</h3>
                <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">{{ approveModal()?.subName }}</p>
              </div>
            </div>
            <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">Are you sure you want to approve this report? This action cannot be undone.</p>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button (click)="closeApproveModal()" style="padding:10px 20px;border:1.5px solid #E5E7EB;border-radius:10px;background:white;color:#6B7280;font-size:14px;font-weight:600;cursor:pointer;">Cancel</button>
              <button
                (click)="confirmApprove()"
                [disabled]="actioningSubId() !== null"
                style="padding:10px 24px;border:none;border-radius:10px;background:linear-gradient(135deg,#16A34A,#22C55E);color:white;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;"
                [style.opacity]="actioningSubId() !== null ? '0.6' : '1'"
              >
                @if (actioningSubId() !== null) {
                  <svg style="animation:spin 1s linear infinite;" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" stroke-width="3"/><path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>
                  Approving...
                } @else {
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  Yes, Approve
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── Reject Modal ──────────────────────────────────────────── -->
      @if (rejectModal()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;" (click)="closeRejectModal()">
          <div style="background:white;border-radius:20px;padding:32px;width:100%;max-width:460px;box-shadow:0 24px 80px rgba(0,0,0,0.3);" (click)="$event.stopPropagation()">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
              <div style="width:40px;height:40px;border-radius:12px;background:#FEE2E2;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="#DC2626"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;">Reject Report</h3>
                <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">{{ rejectModal()?.subName }}</p>
              </div>
            </div>
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">Reason for rejection <span style="color:#DC2626;">*</span></label>
            <textarea
              [value]="rejectReason()"
              (input)="rejectReason.set($any($event.target).value)"
              placeholder="Provide a clear reason so the subordinate can address the issues..."
              rows="4"
              style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;font-family:inherit;resize:vertical;outline:none;transition:border-color 0.2s;"
              class="reject-textarea"
            ></textarea>
            <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
              <button (click)="closeRejectModal()" style="padding:10px 20px;border:1.5px solid #E5E7EB;border-radius:10px;background:white;color:#6B7280;font-size:14px;font-weight:600;cursor:pointer;">Cancel</button>
              <button
                (click)="confirmReject()"
                [disabled]="!rejectReason().trim() || actioningSubId() !== null"
                style="padding:10px 20px;border:none;border-radius:10px;background:#DC2626;color:white;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;"
                [style.opacity]="!rejectReason().trim() || actioningSubId() !== null ? '0.5' : '1'"
              >
                @if (actioningSubId() !== null) {
                  Rejecting...
                } @else {
                  Confirm Reject
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── Toast Notification ──────────────────────────────────── -->
      @if (toast()) {
        <div style="
          position:fixed;bottom:28px;right:28px;z-index:2000;
          display:flex;align-items:center;gap:12px;
          padding:14px 20px;border-radius:14px;
          box-shadow:0 8px 32px rgba(0,0,0,0.18);
          animation:slideInToast 0.3s cubic-bezier(0.22,1,0.36,1);
          min-width:280px;max-width:400px;
        " [style.background]="toast()!.success ? '#F0FDF4' : '#FEF2F2'" [style.border]="'1.5px solid ' + (toast()!.success ? '#86EFAC' : '#FECACA')">
          <div [style]="'width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (toast()!.success ? '#DCFCE7' : '#FEE2E2')">
            @if (toast()!.success) {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#DC2626"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            }
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;" [style.color]="toast()!.success ? '#15803D' : '#B91C1C'">{{ toast()!.success ? 'Success' : 'Failed' }}</div>
            <div style="font-size:12px;margin-top:1px;color:#6B7280;">{{ toast()!.message }}</div>
          </div>
          <button (click)="toast.set(null)" style="background:none;border:none;cursor:pointer;padding:4px;color:#9CA3AF;flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      }
    </div>

    <style>
      @keyframes pageSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes expandRow { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      .table-row-hover:hover td { background:#FDF2FB !important; }
      .rpt-search:focus { border-color: #E068C4 !important; background: white !important; }
      .rpt-dl-btn:hover { border-color: #E068C4 !important; color: #D047AE !important; background: #FDF2FB !important; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes slideInToast { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
      .status-action-select:hover { border-color:#D047AE !important; background:#FDF2FB !important; box-shadow:0 0 0 3px rgba(208,71,174,0.12); }
      .status-action-select:focus { border-color:#8B2D73 !important; background:#FDF2FB !important; box-shadow:0 0 0 3px rgba(139,45,115,0.15); }
      .reject-textarea:focus { border-color: #E068C4 !important; }
    </style>
  `
})
export class ReportsComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  actioningSubId = signal<string | null>(null);
  approveModal = signal<{ subId: string; subName: string } | null>(null);
  rejectModal = signal<{ subId: string; subName: string } | null>(null);
  rejectReason = signal('');
  toast = signal<{ success: boolean; message: string } | null>(null);

  searchQuery = signal('');
  filterStatus = signal('');
  filterCategory = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  private activeTabs: Record<string, string> = {};
  private expandCategoryFilters: Record<string, string> = {};

  role = this.authService.currentRole;
  roleLabel = computed(() => {
    const r = this.role(); return r ? ROLE_LABELS[r] : '';
  });
  subordinateLabel = computed(() => {
    const r = this.role(); return r ? ROLE_SUBORDINATE[r] : '';
  });

  filteredSubordinates = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const category = this.filterCategory();
    const from = this.dateFrom();
    const to = this.dateTo();
    return s.subordinates.filter(sub => {
      const matchName = !query || sub.fullName.toLowerCase().includes(query);
      const matchStatus = !status || sub.status === status;
      const matchCat = !category || sub.tasks.some(t => t.category === category);
      const matchDate = (!from && !to) || sub.tasks.some(t => {
        const d = t.completedDate;
        return (!from || d >= from) && (!to || d <= to);
      });
      return matchName && matchStatus && matchCat && matchDate;
    });
  });

  ngOnInit(): void {
    this.dashboardService.getReports().subscribe(data => {
      this.summary.set(data);
      this.loading.set(false);
    });
  }

  toggleExpand(sub: SubordinateReport): void {
    sub.isExpanded = !sub.isExpanded;
    if (sub.isExpanded && !this.activeTabs[sub.userId]) {
      this.activeTabs[sub.userId] = 'Tasks';
    }
  }

  setActiveTab(userId: string, tab: string): void {
    this.activeTabs[userId] = tab;
  }

  getActiveTab(userId: string): string {
    return this.activeTabs[userId] ?? 'Tasks';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getExpandCategoryFilter(userId: string): string {
    return this.expandCategoryFilters[userId] ?? '';
  }

  setExpandCategoryFilter(userId: string, value: string): void {
    this.expandCategoryFilters[userId] = value;
  }

  filteredTasks(sub: SubordinateReport): any[] {
    const cat = this.getExpandCategoryFilter(sub.userId);
    if (!cat) return sub.tasks;
    return sub.tasks.filter(t => t.category === cat);
  }

  filteredTraining(sub: SubordinateReport): any[] {
    const cat = this.getExpandCategoryFilter(sub.userId);
    if (!cat) return sub.trainingSessions;
    return sub.trainingSessions.filter(ts => ts.category === cat);
  }

  downloadReport(type: 'farm-visits' | 'training'): void {
    const subs = this.filteredSubordinates();
    this.dashboardService.downloadReport({ type, format: 'csv' }, subs);
  }

  rowStyle(sub: SubordinateReport, i: number): string {
    const base = sub.isExpanded ? '#FDF2FB' : (i % 2 === 0 ? 'white' : '#FAFAFA');
    const isPending = sub.status !== 'approved' && sub.status !== 'rejected';
    return `
      background:${base};cursor:pointer;
      border-bottom:1px solid #F3F4F6;
      transition:background 0.15s;
      ${isPending ? 'border-left:3px solid #F59E0B;' : ''}
    `;
  }

  statusBadgeStyle(status: string): string {
    const pending = 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEF9C3;color:#B45309;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;';
    const styles: Record<string, string> = {
      approved:    'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#DCFCE7;color:#16A34A;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;',
      rejected:    'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEE2E2;color:#DC2626;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;',
      pending_fc:  pending,
      pending_pc:  pending,
      pending_gl:  pending,
      pending_csh: pending,
      pending_sh:  pending,
      pending_ch:  pending,
    };
    return styles[status] ?? pending;
  }

  categoryBadge(cat: string): string {
    const styles: Record<string, string> = {
      GAP: 'padding:2px 8px;background:#FADDF2;color:#C2389A;border-radius:6px;font-size:11px;font-weight:700;',
      GEP: 'padding:2px 8px;background:#E0F2FE;color:#0284C7;border-radius:6px;font-size:11px;font-weight:700;',
      GSP: 'padding:2px 8px;background:#EDE9FE;color:#7C3AED;border-radius:6px;font-size:11px;font-weight:700;',
    };
    return styles[cat] ?? '';
  }

  tabStyle(userId: string, tab: string): string {
    const active = this.getActiveTab(userId) === tab;
    return `
      padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
      border:1.5px solid ${active ? '#E068C4' : '#E5E7EB'};
      background:${active ? '#D047AE' : 'white'};
      color:${active ? 'white' : '#6B7280'};
      transition:all 0.2s;
    `;
  }

  onActionSelect(event: Event, sub: SubordinateReport): void {
    const value = (event.target as HTMLSelectElement).value;
    (event.target as HTMLSelectElement).value = '';
    if (value === 'approve') {
      this.approveModal.set({ subId: sub.userId, subName: sub.fullName });
    } else if (value === 'reject') {
      this.openRejectModal(sub);
    }
  }

  closeApproveModal(): void {
    if (this.actioningSubId() !== null) return;
    this.approveModal.set(null);
  }

  confirmApprove(): void {
    const modal = this.approveModal();
    if (!modal) return;
    this.actioningSubId.set(modal.subId);
    const approverName = this.authService.currentUser()?.fullName ?? 'Unknown';
    this.dashboardService.approveOne(modal.subId, approverName).subscribe({
      next: (res) => {
        this.summary.update(s => {
          if (!s) return s;
          return {
            ...s,
            subordinates: s.subordinates.map(r =>
              r.userId === modal.subId ? { ...r, status: 'approved' as const, approvedBy: approverName, approvalDate: new Date().toISOString() } : r
            ),
            approvedCount: s.approvedCount + 1,
            pendingApprovals: Math.max(0, s.pendingApprovals - 1),
          };
        });
        this.actioningSubId.set(null);
        this.approveModal.set(null);
        this.showToast(true, res.message || 'Report approved successfully.');
      },
      error: (err) => {
        this.actioningSubId.set(null);
        this.approveModal.set(null);
        this.showToast(false, err?.error?.message || 'Approval failed. Please try again.');
      }
    });
  }

  openRejectModal(sub: SubordinateReport): void {
    this.rejectReason.set('');
    this.rejectModal.set({ subId: sub.userId, subName: sub.fullName });
  }

  closeRejectModal(): void {
    this.rejectModal.set(null);
    this.rejectReason.set('');
  }

  confirmReject(): void {
    const modal = this.rejectModal();
    const reason = this.rejectReason().trim();
    if (!modal || !reason) return;
    this.actioningSubId.set(modal.subId);
    const approverName = this.authService.currentUser()?.fullName ?? 'Unknown';
    this.dashboardService.rejectOne(modal.subId, reason, approverName).subscribe({
      next: (res) => {
        this.summary.update(s => {
          if (!s) return s;
          return {
            ...s,
            subordinates: s.subordinates.map(r =>
              r.userId === modal.subId ? { ...r, status: 'rejected' as const } : r
            ),
            pendingApprovals: Math.max(0, s.pendingApprovals - 1),
          };
        });
        this.actioningSubId.set(null);
        this.closeRejectModal();
        this.showToast(true, res.message || 'Report rejected.');
      },
      error: (err) => {
        this.actioningSubId.set(null);
        this.showToast(false, err?.error?.message || 'Rejection failed. Please try again.');
      }
    });
  }

  showToast(success: boolean, message: string): void {
    this.toast.set({ success, message });
    setTimeout(() => this.toast.set(null), 5000);
  }
}
