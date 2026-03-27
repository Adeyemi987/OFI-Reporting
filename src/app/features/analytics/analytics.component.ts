import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary, SubordinateReport, ROLE_LABELS, ROLE_SUBORDINATE, UserRole } from '../../core/models';

export type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="animation:pageSlideIn 0.5s cubic-bezier(0.4,0,0.2,1);color:#1A1A1A;">

      <!-- ── Hero Header ──────────────────────────────────────────── -->
      <div style="
        background:linear-gradient(135deg,#4C1D95 0%,#7C3AED 50%,#A78BFA 100%);
        border-radius:24px;padding:32px 36px;margin-bottom:28px;
        position:relative;overflow:hidden;
        box-shadow:0 12px 40px rgba(124,58,237,0.35);
      ">
        <div style="position:absolute;top:-50px;right:-30px;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
        <div style="position:absolute;bottom:-80px;left:40%;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="padding:5px 14px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:30px;font-size:12px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase;">Analytics</span>
          </div>
          <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Performance Analytics</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Visual insights across {{ subordinateLabel() }}</p>
        </div>
      </div>

      <!-- ── Date Filter Bar ──────────────────────────────────────── -->
      <div style="
        display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
        background:white;border-radius:16px;padding:14px 24px;margin-bottom:24px;
        box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #F3F4F6;
        animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) both;
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#D047AE,#E068C4);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(208,71,174,0.25);">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#1A1A1A;">Date Range Filter</div>
            <div style="font-size:11px;color:#9CA3AF;">Filter all rankings by time period</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          @for (opt of dateFilterOptions; track opt.value) {
            <button
              (click)="setDateFilter(opt.value)"
              [style]="dateFilter() === opt.value
                ? 'padding:7px 18px;border-radius:10px;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.25s;background:linear-gradient(135deg,#D047AE,#E068C4);color:white;box-shadow:0 4px 14px rgba(208,71,174,0.3);transform:scale(1.05);'
                : 'padding:7px 18px;border-radius:10px;border:1.5px solid #E5E7EB;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.25s;background:white;color:#6B7280;'"
            >{{ opt.label }}</button>
          }
        </div>
      </div>

      <!-- Active filter summary -->
      @if (dateFilter() !== 'all') {
        <div style="
          display:flex;align-items:center;gap:8px;padding:10px 18px;margin-bottom:20px;
          background:linear-gradient(135deg,#FDF2FB,#FADDF2);border:1px solid #F0B8E0;
          border-radius:12px;animation:rankSlideIn 0.3s ease both;
        ">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="#C2389A"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/></svg>
          <span style="font-size:12px;font-weight:700;color:#C2389A;">
            Showing data for: {{ getFilterLabel() }} · {{ filteredTaskCount() }} tasks · {{ filteredFarmers() }} farmers visited
          </span>
          <button (click)="setDateFilter('all')" style="margin-left:auto;padding:3px 10px;border-radius:6px;border:1px solid #F0B8E0;background:white;font-size:11px;font-weight:600;color:#C2389A;cursor:pointer;">Clear</button>
        </div>
      }

      @if (loading()) {
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
          @for (i of [1,2,3,4]; track i) {
            <div style="background:white;border-radius:20px;padding:28px;height:280px;animation:shimmer 1.5s infinite;background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;"></div>
          }
        </div>
      } @else {

        <!-- ── Category Distribution (Donut chart via CSS) ─────── -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-bottom:28px;">

          <!-- Donut Chart Card -->
          <div class="chart-card" style="
            background:white;border-radius:24px;padding:32px;
            box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;
            transition:all 0.35s cubic-bezier(0.4,0,0.2,1);
            animation:cardFloat3D 0.5s cubic-bezier(0.4,0,0.2,1) both;
          ">
            <h3 style="margin:0 0 24px;font-size:16px;font-weight:800;color:#1A1A1A;">Task Category Distribution</h3>
            <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;">
              <!-- CSS Donut -->
              <div style="position:relative;width:160px;height:160px;flex-shrink:0;">
                <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg);">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F3F4F6" stroke-width="4"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#C2389A" stroke-width="4"
                    [attr.stroke-dasharray]="gapPct() + ' ' + (100 - gapPct())" stroke-dashoffset="0"
                    style="transition:stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1);"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#0EA5E9" stroke-width="4"
                    [attr.stroke-dasharray]="gepPct() + ' ' + (100 - gepPct())" [attr.stroke-dashoffset]="'-' + gapPct()"
                    style="transition:all 1s cubic-bezier(0.4,0,0.2,1);"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8B5CF6" stroke-width="4"
                    [attr.stroke-dasharray]="gspPct() + ' ' + (100 - gspPct())" [attr.stroke-dashoffset]="'-' + (gapPct() + gepPct())"
                    style="transition:all 1s cubic-bezier(0.4,0,0.2,1);"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                  <div style="font-size:24px;font-weight:900;color:#1A1A1A;">{{ totalTasks() }}</div>
                  <div style="font-size:11px;color:#9CA3AF;">Total Tasks</div>
                </div>
              </div>
              <!-- Legend -->
              <div style="display:flex;flex-direction:column;gap:14px;">
                @for (cat of donutData(); track cat.name) {
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div [style]="'width:14px;height:14px;border-radius:4px;background:' + cat.color"></div>
                    <div>
                      <div style="font-size:13px;font-weight:700;color:#1A1A1A;">{{ cat.name }} — {{ cat.count }}</div>
                      <div style="font-size:11px;color:#9CA3AF;">{{ cat.pct }}% of total</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Approval Status Card -->
          <div class="chart-card" style="
            background:white;border-radius:24px;padding:32px;
            box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;
            transition:all 0.35s cubic-bezier(0.4,0,0.2,1);
            animation:cardFloat3D 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s both;
          ">
            <h3 style="margin:0 0 24px;font-size:16px;font-weight:800;color:#1A1A1A;">Approval Status</h3>
            <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;">
              <div style="position:relative;width:160px;height:160px;flex-shrink:0;">
                <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg);">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F3F4F6" stroke-width="4"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#16A34A" stroke-width="4"
                    [attr.stroke-dasharray]="approvedPct() + ' ' + (100 - approvedPct())"
                    style="transition:stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1);"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" stroke-width="4"
                    [attr.stroke-dasharray]="pendingPct() + ' ' + (100 - pendingPct())" [attr.stroke-dashoffset]="'-' + approvedPct()"
                    style="transition:all 1s cubic-bezier(0.4,0,0.2,1);"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                  <div style="font-size:24px;font-weight:900;color:#16A34A;">{{ approvedPct() }}%</div>
                  <div style="font-size:11px;color:#9CA3AF;">Approved</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:14px;height:14px;border-radius:4px;background:#16A34A;"></div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:#1A1A1A;">Approved — {{ summary()?.approvedCount ?? 0 }}</div>
                    <div style="font-size:11px;color:#9CA3AF;">{{ approvedPct() }}%</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:14px;height:14px;border-radius:4px;background:#F59E0B;"></div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:#1A1A1A;">Pending — {{ summary()?.pendingApprovals ?? 0 }}</div>
                    <div style="font-size:11px;color:#9CA3AF;">{{ pendingPct() }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Bar Charts Row ──────────────────────────────────── -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-bottom:28px;">

          <!-- Farmers per Subordinate -->
          <div class="chart-card" style="
            background:white;border-radius:24px;padding:32px;
            box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;
            transition:all 0.35s;
            animation:cardFloat3D 0.5s cubic-bezier(0.4,0,0.2,1) 0.2s both;
          ">
            <h3 style="margin:0 0 24px;font-size:16px;font-weight:800;color:#1A1A1A;">Farmers Visited per {{ subordinateLabel() }}</h3>
            <div style="display:flex;flex-direction:column;gap:14px;">
              @for (sub of barData(); track sub.name; let i = $index) {
                <div style="display:flex;align-items:center;gap:12px;" [style.animation]="'barGrow 0.6s cubic-bezier(0.4,0,0.2,1) ' + (i*0.1) + 's both'">
                  <div style="width:90px;font-size:13px;font-weight:600;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" [title]="sub.name">{{ sub.name }}</div>
                  <div style="flex:1;height:28px;background:#F3F4F6;border-radius:8px;overflow:hidden;position:relative;">
                    <div class="bar-fill" [style]="'height:100%;border-radius:8px;background:linear-gradient(90deg,#D047AE,#E068C4);transition:width 1s cubic-bezier(0.4,0,0.2,1) ' + (i*0.1) + 's;width:' + sub.pct + '%;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;'">
                      <span style="font-size:11px;font-weight:700;color:white;">{{ sub.value }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Category Stacked per Subordinate -->
          <div class="chart-card" style="
            background:white;border-radius:24px;padding:32px;
            box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;
            transition:all 0.35s;
            animation:cardFloat3D 0.5s cubic-bezier(0.4,0,0.2,1) 0.3s both;
          ">
            <h3 style="margin:0 0 24px;font-size:16px;font-weight:800;color:#1A1A1A;">GAP / GEP / GSP Breakdown</h3>
            <div style="display:flex;flex-direction:column;gap:14px;">
              @for (sub of stackedData(); track sub.name; let i = $index) {
                <div [style.animation]="'barGrow 0.6s cubic-bezier(0.4,0,0.2,1) ' + (i*0.1) + 's both'">
                  <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;">{{ sub.name }}</div>
                  <div style="display:flex;height:24px;border-radius:6px;overflow:hidden;background:#F3F4F6;">
                    <div [style]="'height:100%;background:#C2389A;transition:width 1s cubic-bezier(0.4,0,0.2,1);width:' + sub.gapPct + '%;'" title="GAP"></div>
                    <div [style]="'height:100%;background:#0EA5E9;transition:width 1s cubic-bezier(0.4,0,0.2,1);width:' + sub.gepPct + '%;'" title="GEP"></div>
                    <div [style]="'height:100%;background:#8B5CF6;transition:width 1s cubic-bezier(0.4,0,0.2,1);width:' + sub.gspPct + '%;'" title="GSP"></div>
                  </div>
                  <div style="display:flex;gap:12px;margin-top:4px;">
                    <span style="font-size:10px;color:#C2389A;font-weight:700;">{{ sub.gap }} GAP</span>
                    <span style="font-size:10px;color:#0EA5E9;font-weight:700;">{{ sub.gep }} GEP</span>
                    <span style="font-size:10px;color:#8B5CF6;font-weight:700;">{{ sub.gsp }} GSP</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- ── Performance Leaderboard ────────────────────────── -->
        <div class="chart-card" style="
          background:white;border-radius:24px;padding:32px;
          box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;
          animation:cardFloat3D 0.5s cubic-bezier(0.4,0,0.2,1) 0.4s both;
          overflow:hidden;
        ">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EAB308);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(245,158,11,0.3);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              </div>
              <div>
                <h3 style="margin:0;font-size:18px;font-weight:900;color:#1A1A1A;">Performance Leaderboard</h3>
                <p style="margin:2px 0 0;font-size:11px;color:#9CA3AF;font-weight:500;">Ranked by total farmers visited</p>
              </div>
            </div>
            <div style="padding:4px 12px;border-radius:20px;background:linear-gradient(135deg,#FDF2FB,#FADDF2);border:1px solid #F0B8E0;font-size:11px;font-weight:700;color:#C2389A;">
              {{ leaderboard().length }} Contestants
            </div>
          </div>

          <!-- Podium for top 3 -->
          @if (leaderboard().length >= 3) {
            <div style="display:flex;align-items:flex-end;justify-content:center;gap:8px;margin-bottom:32px;padding:20px 0 0;">
              <!-- 2nd Place - SILVER -->
              <div style="display:flex;flex-direction:column;align-items:center;animation:podiumRise 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both;">
                <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#C0C0C0,#A8A8A8);border:3px solid #D4D4D4;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:white;box-shadow:0 4px 16px rgba(192,192,192,0.5);margin-bottom:8px;">
                  🥈
                </div>
                <div style="font-size:12px;font-weight:700;color:#1A1A1A;text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ leaderboard()[1].name }}</div>
                <div style="font-size:18px;font-weight:900;color:#71717A;margin:2px 0;">{{ leaderboard()[1].farmers }}</div>
                <div style="font-size:10px;color:#A1A1AA;font-weight:600;">farmers</div>
                <div style="width:90px;height:80px;margin-top:10px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,#C0C0C0,#D4D4D4);display:flex;align-items:center;justify-content:center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.7"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                </div>
              </div>
              <!-- 1st Place - GOLD -->
              <div style="display:flex;flex-direction:column;align-items:center;animation:podiumRise 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;">
                <div style="position:relative;">
                  <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:22px;animation:crownBounce 1s ease-in-out infinite;">👑</div>
                  <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FFD700,#DAA520);border:4px solid #FFE44D;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:white;box-shadow:0 6px 24px rgba(255,215,0,0.5);margin-bottom:8px;margin-top:10px;">
                    🥇
                  </div>
                </div>
                <div style="font-size:13px;font-weight:800;color:#1A1A1A;text-align:center;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ leaderboard()[0].name }}</div>
                <div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#FFD700,#B8860B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:2px 0;">{{ leaderboard()[0].farmers }}</div>
                <div style="font-size:10px;color:#B8860B;font-weight:700;">farmers</div>
                <div style="width:100px;height:110px;margin-top:10px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,#FFD700,#FFF0A0);border:2px solid #DAA520;border-bottom:none;display:flex;align-items:center;justify-content:center;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#DAA520"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/></svg>
                </div>
              </div>
              <!-- 3rd Place - BRONZE -->
              <div style="display:flex;flex-direction:column;align-items:center;animation:podiumRise 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;">
                <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#CD7F32,#A0522D);border:3px solid #D4944E;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:white;box-shadow:0 4px 16px rgba(205,127,50,0.5);margin-bottom:8px;">
                  🥉
                </div>
                <div style="font-size:12px;font-weight:700;color:#1A1A1A;text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ leaderboard()[2].name }}</div>
                <div style="font-size:18px;font-weight:900;color:#8B4513;margin:2px 0;">{{ leaderboard()[2].farmers }}</div>
                <div style="font-size:10px;color:#A0522D;font-weight:600;">farmers</div>
                <div style="width:90px;height:60px;margin-top:10px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,#CD7F32,#DEB887);display:flex;align-items:center;justify-content:center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.7"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                </div>
              </div>
            </div>
          }

          <!-- Full Ranking List -->
          <div style="display:flex;flex-direction:column;gap:0;">
            @for (sub of leaderboard(); track sub.name; let i = $index) {
              <div class="leader-row" [style]="'display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);animation:rankSlideIn 0.4s ease ' + (i*0.07) + 's both;cursor:pointer;' +
                (i === 0 ? 'background:linear-gradient(135deg,#FFFBEB,#FFF8DC);border:1.5px solid #FFD700;margin-bottom:6px;' :
                 i === 1 ? 'background:linear-gradient(135deg,#FAFAFA,#F5F5F5);border:1.5px solid #C0C0C0;margin-bottom:6px;' :
                 i === 2 ? 'background:linear-gradient(135deg,#FFF8F0,#FDEBD0);border:1.5px solid #CD7F32;margin-bottom:6px;' :
                 'background:#FAFAFA;border:1.5px solid #F3F4F6;margin-bottom:6px;')">
                <!-- Rank Badge -->
                <div [style]="'width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;' +
                  (i === 0 ? 'background:linear-gradient(135deg,#FFD700,#DAA520);color:white;box-shadow:0 3px 10px rgba(255,215,0,0.4);' :
                   i === 1 ? 'background:linear-gradient(135deg,#C0C0C0,#A8A8A8);color:white;box-shadow:0 3px 10px rgba(192,192,192,0.4);' :
                   i === 2 ? 'background:linear-gradient(135deg,#CD7F32,#A0522D);color:white;box-shadow:0 3px 10px rgba(205,127,50,0.4);' :
                   'background:#F3F4F6;color:#6B7280;')">
                  @if (i === 0) { <span>🥇</span> }
                  @else if (i === 1) { <span>🥈</span> }
                  @else if (i === 2) { <span>🥉</span> }
                  @else { <span>{{ i + 1 }}</span> }
                </div>

                <!-- Name & Progress -->
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span [style]="'font-size:13px;font-weight:' + (i < 3 ? '800' : '600') + ';color:#1A1A1A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'">{{ sub.name }}</span>
                    <span [style]="'font-size:15px;font-weight:900;' +
                      (i === 0 ? 'color:#B8860B;' : i === 1 ? 'color:#71717A;' : i === 2 ? 'color:#8B4513;' : 'color:#D047AE;')">
                      {{ sub.farmers }}
                    </span>
                  </div>
                  <!-- Progress Bar -->
                  <div style="height:6px;background:#F3F4F6;border-radius:3px;overflow:hidden;">
                    <div [style]="'height:100%;border-radius:3px;transition:width 1s cubic-bezier(0.4,0,0.2,1);animation:progressGrow 1s ease ' + (i*0.1) + 's both;width:' + getLeaderPercent(sub.farmers) + '%;' +
                      (i === 0 ? 'background:linear-gradient(90deg,#FFD700,#DAA520);' :
                       i === 1 ? 'background:linear-gradient(90deg,#C0C0C0,#A8A8A8);' :
                       i === 2 ? 'background:linear-gradient(90deg,#CD7F32,#A0522D);' :
                       'background:linear-gradient(90deg,#D047AE,#E068C4);')">
                    </div>
                  </div>
                  <!-- Stat Chips -->
                  <div style="display:flex;gap:6px;margin-top:8px;">
                    <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#FADDF2;color:#C2389A;">{{ sub.gap }} GAP</span>
                    <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#E0F2FE;color:#0284C7;">{{ sub.gep }} GEP</span>
                    <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#EDE9FE;color:#7C3AED;">{{ sub.gsp }} GSP</span>
                  </div>
                </div>

                <!-- Trend Arrow -->
                <div [style]="'flex-shrink:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;' +
                  (i < 2 ? 'background:#DCFCE7;' : 'background:#F3F4F6;')">
                  @if (i < 2) {
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                  } @else {
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#9CA3AF"><path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <style>
      @keyframes pageSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes cardFloat3D { from { opacity:0; transform:translateY(30px) rotateX(8deg); } to { opacity:1; transform:translateY(0) rotateX(0); } }
      @keyframes barGrow { from { opacity:0; transform:scaleX(0.3); } to { opacity:1; transform:scaleX(1); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      @keyframes podiumRise { from { opacity:0; transform:translateY(40px) scale(0.9); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes rankSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
      @keyframes progressGrow { from { width:0 !important; } }
      @keyframes crownBounce { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(-4px); } }
      .chart-card:hover { transform:translateY(-4px) !important; box-shadow:0 16px 48px rgba(0,0,0,0.12) !important; }
      .leader-row:hover { transform:translateX(4px) scale(1.01) !important; box-shadow:0 6px 20px rgba(0,0,0,0.08) !important; }
    </style>
  `
})
export class AnalyticsComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  dateFilter = signal<DateRange>('all');

  dateFilterOptions: { label: string; value: DateRange }[] = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' },
  ];

  role = this.authService.currentRole;
  subordinateLabel = computed(() => {
    const r = this.role(); return r ? ROLE_SUBORDINATE[r] : '';
  });

  // ─── Date filter logic ───────────────────────────────────────
  private getDateCutoff(): Date {
    const now = new Date();
    switch (this.dateFilter()) {
      case 'week': {
        const d = new Date(now); d.setDate(d.getDate() - 7); return d;
      }
      case 'month': {
        const d = new Date(now); d.setMonth(d.getMonth() - 1); return d;
      }
      case 'quarter': {
        const d = new Date(now); d.setMonth(d.getMonth() - 3); return d;
      }
      case 'year': {
        const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d;
      }
      default: return new Date(0);
    }
  }

  /** Returns subordinates with recalculated metrics based on filtered tasks */
  filteredSubs = computed(() => {
    const subs = this.summary()?.subordinates ?? [];
    const cutoff = this.getDateCutoff();
    return subs.map(s => {
      const tasks = s.tasks.filter(t => new Date(t.completedDate) >= cutoff);
      const training = s.trainingSessions.filter(t => new Date(t.date) >= cutoff);
      const gap = tasks.filter(t => t.category === 'GAP').length;
      const gep = tasks.filter(t => t.category === 'GEP').length;
      const gsp = tasks.filter(t => t.category === 'GSP').length;
      const farmers = tasks.reduce((sum, t) => sum + t.farmersVisited, 0);
      return { ...s, tasks, trainingSessions: training, farmersVisited: farmers, gapCount: gap, gepCount: gep, gspCount: gsp };
    });
  });

  filteredTaskCount = computed(() => this.filteredSubs().reduce((s, sub) => s + sub.tasks.length, 0));
  filteredFarmers = computed(() => this.filteredSubs().reduce((s, sub) => s + sub.farmersVisited, 0));

  // ─── Totals from filtered data ───────────────────────────────
  totalGAP = computed(() => this.filteredSubs().reduce((s, sub) => s + sub.gapCount, 0));
  totalGEP = computed(() => this.filteredSubs().reduce((s, sub) => s + sub.gepCount, 0));
  totalGSP = computed(() => this.filteredSubs().reduce((s, sub) => s + sub.gspCount, 0));

  totalTasks = computed(() => this.totalGAP() + this.totalGEP() + this.totalGSP());

  gapPct = computed(() => { const t = this.totalTasks() || 1; return Math.round((this.totalGAP() / t) * 100); });
  gepPct = computed(() => { const t = this.totalTasks() || 1; return Math.round((this.totalGEP() / t) * 100); });
  gspPct = computed(() => { const t = this.totalTasks() || 1; return Math.round((this.totalGSP() / t) * 100); });

  approvedPct = computed(() => {
    const s = this.summary(); if (!s) return 0;
    const total = s.totalSubordinates || 1;
    return Math.round((s.approvedCount / total) * 100);
  });
  pendingPct = computed(() => {
    const s = this.summary(); if (!s) return 0;
    const total = s.totalSubordinates || 1;
    return Math.round((s.pendingApprovals / total) * 100);
  });

  donutData = computed(() => [
    { name: 'GAP', count: this.totalGAP(), pct: this.gapPct(), color: '#C2389A' },
    { name: 'GEP', count: this.totalGEP(), pct: this.gepPct(), color: '#0EA5E9' },
    { name: 'GSP', count: this.totalGSP(), pct: this.gspPct(), color: '#8B5CF6' },
  ]);

  barData = computed(() => {
    const subs = [...this.filteredSubs()];
    subs.sort((a, b) => b.farmersVisited - a.farmersVisited);
    const max = Math.max(...subs.map(s => s.farmersVisited), 1);
    return subs.map(s => ({ name: s.fullName, value: s.farmersVisited, pct: Math.round((s.farmersVisited / max) * 100) }));
  });

  stackedData = computed(() => {
    const subs = [...this.filteredSubs()];
    subs.sort((a, b) => (b.gapCount + b.gepCount + b.gspCount) - (a.gapCount + a.gepCount + a.gspCount));
    return subs.map(s => {
      const total = s.gapCount + s.gepCount + s.gspCount || 1;
      return {
        name: s.fullName, gap: s.gapCount, gep: s.gepCount, gsp: s.gspCount,
        gapPct: Math.round((s.gapCount / total) * 100),
        gepPct: Math.round((s.gepCount / total) * 100),
        gspPct: Math.round((s.gspCount / total) * 100),
      };
    });
  });

  leaderboard = computed(() => {
    const subs = [...this.filteredSubs()];
    subs.sort((a, b) => b.farmersVisited - a.farmersVisited);
    return subs.map(s => ({ name: s.fullName, farmers: s.farmersVisited, gap: s.gapCount, gep: s.gepCount, gsp: s.gspCount }));
  });

  getLeaderPercent(farmers: number): number {
    const max = this.leaderboard()[0]?.farmers || 1;
    return Math.round((farmers / max) * 100);
  }

  setDateFilter(range: DateRange): void {
    this.dateFilter.set(range);
  }

  getFilterLabel(): string {
    return this.dateFilterOptions.find(o => o.value === this.dateFilter())?.label ?? 'All Time';
  }

  ngOnInit(): void {
    const role = this.role();
    if (!role) return;
    this.dashboardService.getDashboard(role).subscribe(data => {
      this.summary.set(data);
      this.loading.set(false);
    });
  }
}
