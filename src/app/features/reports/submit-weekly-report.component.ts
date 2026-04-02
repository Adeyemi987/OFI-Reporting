import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { API_BASE_URL } from '../../core/tokens';

@Component({
  selector: 'app-submit-weekly-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1A1A1A; min-height: 100vh; padding: 32px 24px;
      background: #F8FAFC; animation: pageIn 0.4s ease-out;
      box-sizing: border-box; max-width: 900px; margin: 0 auto;
    ">

      <!-- Back Button -->
      <button
        (click)="goBack()"
        style="
          display: inline-flex; align-items: center; gap: 6px;
          margin-bottom: 24px; padding: 10px 18px;
          background: #F0B8E0; color: #8B2D73; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; font-size: 14px; transition: background 0.2s;
        "
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Back to Dashboard
      </button>

      <!-- Page Header -->
      <div style="
        background: linear-gradient(135deg, #8B2D73 0%, #D047AE 50%, #D960BA 100%);
        border-radius: 20px; padding: 28px 32px; margin-bottom: 28px;
        position: relative; overflow: hidden;
        box-shadow: 0 8px 32px rgba(208,71,174,0.3);
      ">
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
        <div style="position:absolute;bottom:-60px;right:80px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
            <div style="
              width:44px;height:44px;border-radius:14px;
              background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);
              display:flex;align-items:center;justify-content:center;
            ">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="white">
                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 style="margin:0;font-size:24px;font-weight:900;color:white;letter-spacing:-0.5px;">Submit Weekly Report</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Fill in all required fields to submit your weekly field report</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Banner -->
      @if (successMessage()) {
        <div style="
          background: #DCFCE7; border: 1px solid #86EFAC;
          border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 12px;
          color: #166534; font-size: 14px; font-weight: 600;
        ">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="flex-shrink:0;">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          {{ successMessage() }}
        </div>
      }

      <!-- Error Banner -->
      @if (errorMessage()) {
        <div style="
          background: #FEE2E2; border: 1px solid #FECACA;
          border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 12px;
          color: #DC2626; font-size: 14px; font-weight: 600;
        ">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="flex-shrink:0;">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ errorMessage() }}
        </div>
      }

      <!-- Form Card -->
      <form [formGroup]="reportForm" (ngSubmit)="onSubmit()" novalidate>
        <div style="display:flex;flex-direction:column;gap:20px;">

          <!-- Section: Field Officer Info -->
          <div style="
            background:white; border-radius:16px; padding:24px;
            box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid #F3F4F6;
          ">
            <h3 style="margin:0 0 20px;font-size:14px;font-weight:800;color:#8B2D73;text-transform:uppercase;letter-spacing:0.5px;">
              Field Officer Information
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">

              <!-- FO Name -->
              <div>
                <label [style]="labelStyle">FO Name <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="foName"
                  type="text"
                  placeholder="Enter full name"
                  [style]="inputStyle(isInvalid('foName'))"
                />
                @if (isInvalid('foName')) {
                  <p [style]="errorTextStyle">FO Name is required.</p>
                }
              </div>

              <!-- Supervisor dropdown -->
              <div>
                <label [style]="labelStyle">Supervisor (FC) <span style="color:#DC2626;">*</span></label>
                <div style="position:relative;">
                  <select
                    formControlName="supervisorId"
                    [style]="inputStyle(isInvalid('supervisorId')) + 'appearance:none;-webkit-appearance:none;padding-right:36px;'"
                    [attr.disabled]="supervisorsLoading() ? '' : null"
                    [style.opacity]="supervisorsLoading() ? '0.6' : '1'"
                    [style.cursor]="supervisorsLoading() ? 'not-allowed' : 'pointer'"
                  >
                    @if (supervisorsLoading()) {
                      <option value="" disabled>Loading supervisors...</option>
                    } @else if (supervisors().length === 0) {
                      <option value="" disabled>No supervisors found</option>
                    } @else {
                      <option value="" disabled>Select your supervisor...</option>
                      @for (s of supervisors(); track s.id) {
                        <option [value]="s.id">{{ s.fullName }}</option>
                      }
                    }
                  </select>
                  @if (supervisorsLoading()) {
                    <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);animation:spin 1s linear infinite;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#E5E7EB" stroke-width="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="#8B2D73" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                  } @else {
                    <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="13" height="13" viewBox="0 0 20 20" fill="#6B7280">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  }
                </div>
                @if (supervisorsFetchError()) {
                  <p [style]="errorTextStyle">{{ supervisorsFetchError() }}</p>
                }
                @if (isInvalid('supervisorId')) {
                  <p [style]="errorTextStyle">Please select a supervisor.</p>
                }
              </div>

            </div>
          </div>

          <!-- Section: Report Period -->
          <div style="
            background:white; border-radius:16px; padding:24px;
            box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid #F3F4F6;
          ">
            <h3 style="margin:0 0 20px;font-size:14px;font-weight:800;color:#8B2D73;text-transform:uppercase;letter-spacing:0.5px;">
              Report Period
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">

              <!-- Module Captured -->
              <div>
                <label [style]="labelStyle">Module Captured <span style="color:#DC2626;">*</span></label>
                <div style="display:flex;gap:20px;margin-top:8px;flex-wrap:wrap;">
                  @for (opt of moduleOptions; track opt.value) {
                    <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;">
                      <input
                        type="radio"
                        formControlName="category"
                        [value]="opt.value"
                        style="accent-color:#821E75;width:16px;height:16px;cursor:pointer;"
                      />
                      {{ opt.label }}
                    </label>
                  }
                </div>
                @if (isInvalid('category')) {
                  <p [style]="errorTextStyle">Module Captured is required.</p>
                }
              </div>

              <!-- Week Number -->
              <div>
                <label [style]="labelStyle">Week Number <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="weekNumber"
                  type="number"
                  placeholder="1 – 53"
                  min="1"
                  max="53"
                  [style]="inputStyle(isInvalid('weekNumber'))"
                />
                @if (isInvalidWithError('weekNumber', 'required')) {
                  <p [style]="errorTextStyle">Week number is required.</p>
                } @else if (isInvalidWithError('weekNumber', 'min') || isInvalidWithError('weekNumber', 'max')) {
                  <p [style]="errorTextStyle">Must be between 1 and 53.</p>
                }
              </div>

              <!-- Year -->
              <div>
                <label [style]="labelStyle">Year <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="year"
                  type="number"
                  placeholder="e.g. 2026"
                  min="2020"
                  max="2099"
                  [style]="inputStyle(isInvalid('year'))"
                />
                @if (isInvalidWithError('year', 'required')) {
                  <p [style]="errorTextStyle">Year is required.</p>
                } @else if (isInvalidWithError('year', 'min') || isInvalidWithError('year', 'max')) {
                  <p [style]="errorTextStyle">Enter a valid year (2020 – 2099).</p>
                }
              </div>

              <!-- Week Start Date -->
              <div>
                <label [style]="labelStyle">Week Start Date <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="weekStartDate"
                  type="date"
                  [style]="inputStyle(isInvalid('weekStartDate'))"
                />
                @if (isInvalid('weekStartDate')) {
                  <p [style]="errorTextStyle">Week start date is required.</p>
                }
              </div>

              <!-- Week End Date -->
              <div>
                <label [style]="labelStyle">Week End Date <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="weekEndDate"
                  type="date"
                  [style]="inputStyle(isInvalid('weekEndDate'))"
                />
                @if (isInvalid('weekEndDate')) {
                  <p [style]="errorTextStyle">Week end date is required.</p>
                }
              </div>

            </div>
          </div>

          <!-- Section: Activity Metrics -->
          <div style="
            background:white; border-radius:16px; padding:24px;
            box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid #F3F4F6;
          ">
            <h3 style="margin:0 0 20px;font-size:14px;font-weight:800;color:#8B2D73;text-transform:uppercase;letter-spacing:0.5px;">
              Activity Metrics
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">

              <!-- Number of Farmers attended to -->
              <div>
                <label [style]="labelStyle">Number of Farmers attended to <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="totalFarmsVisited"
                  type="number"
                  placeholder="0"
                  min="0"
                  [style]="inputStyle(isInvalid('totalFarmsVisited'))"
                />
                @if (isInvalidWithError('totalFarmsVisited', 'required')) {
                  <p [style]="errorTextStyle">Number of Farmers attended to is required.</p>
                } @else if (isInvalidWithError('totalFarmsVisited', 'min')) {
                  <p [style]="errorTextStyle">Cannot be negative.</p>
                }
              </div>

              <!-- Total Training Sessions -->
              <div>
                <label [style]="labelStyle">Total Training Sessions <span style="color:#DC2626;">*</span></label>
                <input
                  formControlName="totalTrainingSessions"
                  type="number"
                  placeholder="0"
                  min="0"
                  [style]="inputStyle(isInvalid('totalTrainingSessions'))"
                />
                @if (isInvalidWithError('totalTrainingSessions', 'required')) {
                  <p [style]="errorTextStyle">Total training sessions is required.</p>
                } @else if (isInvalidWithError('totalTrainingSessions', 'min')) {
                  <p [style]="errorTextStyle">Cannot be negative.</p>
                }
              </div>

            </div>
          </div>

          <!-- Section: Narrative Fields -->
          <div style="
            background:white; border-radius:16px; padding:24px;
            box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid #F3F4F6;
          ">
            <h3 style="margin:0 0 20px;font-size:14px;font-weight:800;color:#8B2D73;text-transform:uppercase;letter-spacing:0.5px;">
              Field Notes
            </h3>
            <div style="display:flex;flex-direction:column;gap:16px;">

              <!-- Challenges -->
              <div>
                <label [style]="labelStyle">Challenges <span style="color:#DC2626;">*</span></label>
                <textarea
                  formControlName="challenges"
                  rows="4"
                  placeholder="Describe challenges encountered during the week..."
                  [style]="textareaStyle(isInvalid('challenges'))"
                ></textarea>
                @if (isInvalid('challenges')) {
                  <p [style]="errorTextStyle">Challenges field is required.</p>
                }
              </div>

              <!-- Common Findings -->
              <div>
                <label [style]="labelStyle">Common Findings <span style="color:#DC2626;">*</span></label>
                <textarea
                  formControlName="commonFindings"
                  rows="4"
                  placeholder="Summarise common findings from farm visits..."
                  [style]="textareaStyle(isInvalid('commonFindings'))"
                ></textarea>
                @if (isInvalid('commonFindings')) {
                  <p [style]="errorTextStyle">Common findings field is required.</p>
                }
              </div>

              <!-- Feedback -->
              <div>
                <label [style]="labelStyle">Feedback <span style="color:#DC2626;">*</span></label>
                <textarea
                  formControlName="feedBack"
                  rows="4"
                  placeholder="Provide any additional feedback or recommendations..."
                  [style]="textareaStyle(isInvalid('feedBack'))"
                ></textarea>
                @if (isInvalid('feedBack')) {
                  <p [style]="errorTextStyle">Feedback field is required.</p>
                }
              </div>

            </div>
          </div>

          <!-- Submit Row -->
          <div style="display:flex;justify-content:flex-end;gap:12px;padding-bottom:16px;">
            <button
              type="button"
              (click)="goBack()"
              style="
                padding: 13px 28px; border-radius: 12px; font-size: 14px; font-weight: 700;
                cursor: pointer; border: 2px solid #E5E7EB; background: white; color: #6B7280;
                transition: all 0.2s;
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="submitting()"
              style="
                padding: 13px 32px; border-radius: 12px; font-size: 14px; font-weight: 700;
                cursor: pointer; border: none; color: white;
                background: linear-gradient(135deg, #8B2D73, #D047AE);
                box-shadow: 0 4px 16px rgba(208,71,174,0.4);
                transition: all 0.2s; display: flex; align-items: center; gap: 8px;
                opacity: 1;
              "
              [style.opacity]="submitting() ? '0.65' : '1'"
              [style.cursor]="submitting() ? 'not-allowed' : 'pointer'"
            >
              @if (submitting()) {
                <svg style="animation:spin 1s linear infinite;" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
                Submitting...
              } @else {
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                Submit Report
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  `
})
export class SubmitWeeklyReportComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly submitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly supervisors = signal<{ id: string; fullName: string }[]>([]);
  readonly supervisorsLoading = signal(false);
  readonly supervisorsFetchError = signal('');

  readonly moduleOptions = [
    { value: 0, label: 'GAP' },
    { value: 1, label: 'GEP' },
    { value: 2, label: 'GSP' },
  ];

  readonly reportForm = this.fb.group({
    foName: ['', Validators.required],
    category: ['' as unknown as number, Validators.required],
    weekNumber: [null as unknown as number, [Validators.required, Validators.min(1), Validators.max(53)]],
    year: [null as unknown as number, [Validators.required, Validators.min(2020), Validators.max(2099)]],
    supervisorId: ['', Validators.required],
    totalFarmsVisited: [null as unknown as number, [Validators.required, Validators.min(0)]],
    totalTrainingSessions: [null as unknown as number, [Validators.required, Validators.min(0)]],
    weekStartDate: ['', Validators.required],
    weekEndDate: ['', Validators.required],
    challenges: ['', Validators.required],
    commonFindings: ['', Validators.required],
    feedBack: ['', Validators.required],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user?.fullName) {
      this.reportForm.patchValue({ foName: user.fullName });
    }
    this.loadSupervisors();
  }

  private loadSupervisors(): void {
    this.supervisorsLoading.set(true);
    this.supervisorsFetchError.set('');
    const params = new HttpParams()
      .set('Role', '5')
      .set('PageNumber', '1')
      .set('PageSize', '100');
    this.http.get<{ success: boolean; data: Record<string, unknown> }>(
      `${this.baseUrl}/api/Users`, { params }
    ).subscribe({
      next: (res) => {
        const raw = (res?.data?.['Items'] ?? res?.data?.['items'] ?? []) as { Id?: string; id?: string; FullName?: string; fullName?: string }[];
        this.supervisors.set(
          raw.map(s => ({ id: (s.Id ?? s.id ?? '') as string, fullName: (s.FullName ?? s.fullName ?? '') as string }))
        );
        this.supervisorsLoading.set(false);
      },
      error: () => {
        this.supervisorsFetchError.set('Failed to load supervisors. Please refresh the page.');
        this.supervisorsLoading.set(false);
      }
    });
  }

  goBack(): void {
    const isAuthenticated = this.auth.isAuthenticated();
    this.router.navigate([isAuthenticated ? '/dashboard' : '/auth/login']);
  }

  isInvalid(field: string): boolean {
    const control = this.reportForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  isInvalidWithError(field: string, error: string): boolean {
    const control = this.reportForm.get(field);
    return !!(control && control.touched && control.hasError(error));
  }

  onSubmit(): void {
    this.reportForm.markAllAsTouched();
    if (this.reportForm.invalid) return;

    this.submitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const raw = this.reportForm.getRawValue();
    const payload = {
      foName: raw.foName,
      category: Number(raw.category),
      weekNumber: Number(raw.weekNumber),
      year: Number(raw.year),
      supervisorId: raw.supervisorId,
      totalFarmsVisited: Number(raw.totalFarmsVisited),
      totalTrainingSessions: Number(raw.totalTrainingSessions),
      weekStartDate: new Date(raw.weekStartDate!).toISOString(),
      weekEndDate: new Date(raw.weekEndDate!).toISOString(),
      challenges: raw.challenges,
      commonFindings: raw.commonFindings,
      feedBack: raw.feedBack,
    };

    this.api.post('/api/Reports', payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set('Weekly report submitted successfully!');
        this.reportForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const message = (err as { error?: { message?: string }; message?: string })?.error?.message
          ?? (err as { message?: string })?.message
          ?? 'Failed to submit report. Please try again.';
        this.errorMessage.set(message);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  readonly labelStyle = `
    display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;
  `;

  readonly errorTextStyle = `
    margin: 4px 0 0; font-size: 12px; color: #DC2626; font-weight: 500;
  `;

  inputStyle(invalid: boolean): string {
    return `
      width: 100%; padding: 11px 14px; border-radius: 10px; font-size: 14px; color: #1A1A1A;
      border: 1.5px solid ${invalid ? '#F87171' : '#E5E7EB'}; outline: none;
      background: ${invalid ? '#FEF2F2' : '#FAFAFA'};
      transition: border-color 0.2s, background 0.2s; box-sizing: border-box; font-family: inherit;
    `;
  }

  textareaStyle(invalid: boolean): string {
    return `
      width: 100%; padding: 11px 14px; border-radius: 10px; font-size: 14px; color: #1A1A1A;
      border: 1.5px solid ${invalid ? '#F87171' : '#E5E7EB'}; outline: none; resize: vertical;
      background: ${invalid ? '#FEF2F2' : '#FAFAFA'}; font-family: inherit;
      transition: border-color 0.2s, background 0.2s; box-sizing: border-box;
    `;
  }
}
