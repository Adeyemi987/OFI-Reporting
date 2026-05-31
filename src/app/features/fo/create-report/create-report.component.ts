import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OfflineReportSyncService } from '../../../core/services/offline-report-sync.service';
import { FODashboardService } from '../../../core/services/fo-dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorModalService } from '../../../core/services/error-modal.service';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { WeeklyReportSubmitPayload } from '../../../core/models/offline-report.models';
import { API_BASE_URL } from '../../../core/tokens';
import { debounceTime, distinctUntilChanged, merge } from 'rxjs';

interface DraftData {
  formValue: any;
  currentStep: number;
  selectedFileName?: string;
  timestamp: number;
}

interface ExistingEvidence {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
}

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-report.component.html',
  styleUrls: ['./create-report.component.css']
})
export class CreateReportComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  readonly offlineSync = inject(OfflineReportSyncService);
  private foDashboard = inject(FODashboardService);
  private toast = inject(ToastService);
  private errorModal = inject(ErrorModalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private previewObjectUrls: string[] = [];

  private readonly DRAFT_KEY = 'weekly_report_draft';
  private autoSaveSubscription: any;

  reportForm!: FormGroup;
  currentStep = signal(1);
  submitting = signal(false);
  loadingReport = signal(false);
  selectedFile = signal<File | null>(null);
  hasDraft = signal(false);
  showFarmVisitSetup = signal(false);
  canProceedToNext = signal(false);
  resubmitReportId = signal<string | null>(null);
  rejectionReason = signal<string | null>(null);
  existingEvidence = signal<ExistingEvidence | null>(null);
  existingEvidencePreviewUrl = signal<string | null>(null);
  existingEvidencePreviewLoading = signal(false);
  selectedFilePreviewUrl = signal<string | null>(null);

  isResubmitMode = computed(() => !!this.resubmitReportId());
  hasEvidenceAttached = computed(() => !!this.selectedFile() || !!this.existingEvidence());

  readonly categoryOptions = [
    { value: 0, label: 'GAP' },
    { value: 1, label: 'GEP' },
    { value: 2, label: 'GSP' }
  ];

  ngOnInit(): void {
    this.initForm();
    const reportId = this.route.snapshot.paramMap.get('id');
    if (reportId) {
      this.resubmitReportId.set(reportId);
      this.loadReportForResubmit(reportId);
    } else {
      this.checkForDraft();
    }
    this.setupAutoSave();
    this.setupNavigationRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
    this.revokeAllPreviewUrls();
  }

  initForm(): void {
    this.reportForm = this.fb.group({
      weekNumber: [null, [Validators.required, Validators.min(1), Validators.max(53)]],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
      weekStartDate: ['', Validators.required],
      weekEndDate: ['', Validators.required],
      challenges: ['', Validators.required],
      commonFindings: ['', Validators.required],
      farmVisits: this.fb.array([]),
      trainingSessions: this.fb.array([]),
      taskRecords: this.fb.array([]),
      evidenceType: ['ProofofVisitPhoto', Validators.required]
    });
  }

  checkForDraft(): void {
    const draft = localStorage.getItem(this.DRAFT_KEY);
    if (draft) {
      this.hasDraft.set(true);
    }
  }

  loadDraft(): void {
    const draft = localStorage.getItem(this.DRAFT_KEY);
    if (!draft) return;

    try {
      const draftData: DraftData = JSON.parse(draft);
      const formValue = draftData.formValue;

      this.reportForm.patchValue({
        weekNumber: formValue.weekNumber,
        year: formValue.year,
        weekStartDate: formValue.weekStartDate,
        weekEndDate: formValue.weekEndDate,
        challenges: formValue.challenges,
        commonFindings: formValue.commonFindings,
        evidenceType: formValue.evidenceType ?? 'ProofofVisitPhoto'
      });

      if (formValue.farmVisits && formValue.farmVisits.length > 0) {
        this.showFarmVisitSetup.set(true);
        formValue.farmVisits.forEach((visit: any) => {
          const visitGroup = this.createFarmVisit();
          visitGroup.patchValue({
            title: visit.title ?? visit.topic ?? formValue.farmVisitTopic ?? '',
            tag: visit.tag ?? visit.farmerId ?? '',
            farmerName: visit.farmerName,
            visitDate: visit.visitDate,
            notes: visit.notes
          });
          this.farmVisits.push(visitGroup);
        });
      }

      if (formValue.trainingSessions && formValue.trainingSessions.length > 0) {
        formValue.trainingSessions.forEach((session: any) => {
          const sessionGroup = this.createTrainingSession();
          sessionGroup.patchValue({
            title: session.title,
            sessionDate: session.sessionDate,
            category: session.category
          });

          if (session.attendances && session.attendances.length > 0) {
            const attendancesArray = sessionGroup.get('attendances') as FormArray;
            session.attendances.forEach((attendance: any) => {
              const attendanceGroup = this.createAttendance();
              attendanceGroup.patchValue(attendance);
              attendancesArray.push(attendanceGroup);
            });
          }

          this.trainingSessions.push(sessionGroup);
        });
      }

      this.currentStep.set(draftData.currentStep);
      this.refreshNavigationState();

      this.hasDraft.set(false);
      this.toast.show('Draft Loaded', 'Your previous draft has been restored', 'success', 3000);
    } catch (error) {
      this.toast.show('Error', 'Failed to load draft', 'error');
    }
  }

  discardDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
    this.hasDraft.set(false);
    this.toast.show('Draft Discarded', 'Starting with a fresh form', 'info', 3000);
  }

  setupAutoSave(): void {
    this.autoSaveSubscription = this.reportForm.valueChanges
      .pipe(
        debounceTime(2000),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        this.saveDraft();
      });
  }

  setupNavigationRefresh(): void {
    merge(
      this.reportForm.valueChanges,
      this.reportForm.statusChanges
    ).subscribe(() => this.refreshNavigationState());

    this.refreshNavigationState();
  }

  refreshNavigationState(): void {
    this.canProceedToNext.set(this.isStepValid(this.currentStep()));
  }

  private normalizeCategory(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const category = Number(value);
    return category === 0 || category === 1 || category === 2 ? category : null;
  }

  saveDraft(): void {
    if (this.isResubmitMode() || this.reportForm.pristine) return;

    const draftData: DraftData = {
      formValue: this.reportForm.value,
      currentStep: this.currentStep(),
      selectedFileName: this.selectedFile()?.name,
      timestamp: Date.now()
    };

    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draftData));
  }

  clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
  }

  get farmVisits(): FormArray {
    return this.reportForm.get('farmVisits') as FormArray;
  }

  get trainingSessions(): FormArray {
    return this.reportForm.get('trainingSessions') as FormArray;
  }

  get taskRecords(): FormArray {
    return this.reportForm.get('taskRecords') as FormArray;
  }

  createFarmVisit(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      tag: ['', Validators.required],
      farmerName: ['', Validators.required],
      visitDate: ['', Validators.required],
      notes: ['', Validators.required]
    });
  }

  openFarmVisitSetup(): void {
    this.showFarmVisitSetup.set(true);
    if (this.farmVisits.length === 0) {
      this.farmVisits.push(this.createFarmVisit());
    }
    this.refreshNavigationState();
  }

  addFarmVisit(): void {
    this.showFarmVisitSetup.set(true);
    this.farmVisits.push(this.createFarmVisit());
    this.refreshNavigationState();
  }

  removeFarmVisit(index: number): void {
    this.farmVisits.removeAt(index);
    if (this.farmVisits.length === 0) {
      this.showFarmVisitSetup.set(false);
    }
    this.refreshNavigationState();
  }

  createTrainingSession(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      sessionDate: ['', Validators.required],
      category: [null, Validators.required],
      attendances: this.fb.array([])
    });
  }

  addTrainingSession(): void {
    this.trainingSessions.push(this.createTrainingSession());
  }

  removeTrainingSession(index: number): void {
    this.trainingSessions.removeAt(index);
  }

  getAttendances(sessionIndex: number): FormArray {
    return this.trainingSessions.at(sessionIndex).get('attendances') as FormArray;
  }

  createAttendance(): FormGroup {
    return this.fb.group({
      attendeeName: ['', Validators.required],
      attendeeId: ['', Validators.required]
    });
  }

  addAttendance(sessionIndex: number): void {
    this.getAttendances(sessionIndex).push(this.createAttendance());
  }

  removeAttendance(sessionIndex: number, attendanceIndex: number): void {
    this.getAttendances(sessionIndex).removeAt(attendanceIndex);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.revokePreviewUrl(this.selectedFilePreviewUrl());
      this.selectedFile.set(file);
      this.selectedFilePreviewUrl.set(this.createPreviewUrl(file));
      this.refreshNavigationState();
    }
  }

  removeExistingEvidence(): void {
    this.revokePreviewUrl(this.existingEvidencePreviewUrl());
    this.existingEvidencePreviewUrl.set(null);
    this.existingEvidence.set(null);
    this.resetFileInput();
    this.refreshNavigationState();
  }

  removeSelectedFile(): void {
    this.revokePreviewUrl(this.selectedFilePreviewUrl());
    this.selectedFilePreviewUrl.set(null);
    this.selectedFile.set(null);
    this.resetFileInput();
    this.refreshNavigationState();
  }

  private resetFileInput(): void {
    const input = this.fileInputRef?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private loadExistingEvidencePreview(evidence: ExistingEvidence): void {
    if (!evidence.downloadUrl) return;

    this.existingEvidencePreviewLoading.set(true);
    const url = evidence.downloadUrl.startsWith('http')
      ? evidence.downloadUrl
      : `${this.baseUrl}${evidence.downloadUrl}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.revokePreviewUrl(this.existingEvidencePreviewUrl());
        this.existingEvidencePreviewUrl.set(this.createPreviewUrl(blob));
        this.existingEvidencePreviewLoading.set(false);
      },
      error: () => {
        this.existingEvidencePreviewLoading.set(false);
      }
    });
  }

  private createPreviewUrl(source: Blob | File): string {
    const url = URL.createObjectURL(source);
    this.previewObjectUrls.push(url);
    return url;
  }

  private revokePreviewUrl(url: string | null): void {
    if (!url) return;
    URL.revokeObjectURL(url);
    this.previewObjectUrls = this.previewObjectUrls.filter(item => item !== url);
  }

  private revokeAllPreviewUrls(): void {
    this.previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewObjectUrls = [];
    this.existingEvidencePreviewUrl.set(null);
    this.selectedFilePreviewUrl.set(null);
  }

  isFieldInvalid(group: AbstractControl, field: string): boolean {
    const control = group.get(field);
    return !!(control && control.invalid && control.touched);
  }

  areTrainingSessionsValid(): boolean {
    for (let i = 0; i < this.trainingSessions.length; i++) {
      const session = this.trainingSessions.at(i);
      if (!session.valid) return false;
      const attendances = this.getAttendances(i);
      if (attendances.length > 0 && !attendances.valid) return false;
    }
    return true;
  }

  isFarmVisitLayerValid(): boolean {
    if (this.farmVisits.length === 0) {
      return true;
    }

    for (let i = 0; i < this.farmVisits.length; i++) {
      if (!this.farmVisits.at(i).valid) {
        return false;
      }
    }

    return true;
  }

  markStepTouched(step: number): void {
    if (step === 1) {
      Object.keys(this.reportForm.controls).forEach(key => {
        if (key !== 'farmVisits' && key !== 'trainingSessions' && key !== 'taskRecords') {
          this.reportForm.get(key)?.markAsTouched();
        }
      });
    }
    if (step === 2) {
      this.farmVisits.markAllAsTouched();
    }
    if (step === 3) {
      this.trainingSessions.markAllAsTouched();
      this.trainingSessions.controls.forEach((_, i) => this.getAttendances(i).markAllAsTouched());
    }
  }

  nextStep(): void {
    const step = this.currentStep();
    if (!this.isStepValid(step)) {
      this.markStepTouched(step);
      this.toast.show('Validation Error', 'Please complete all required fields before continuing.', 'error');
      return;
    }

    if (step < 4) {
      this.currentStep.update(s => s + 1);
      this.refreshNavigationState();
      this.saveDraft();
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      this.refreshNavigationState();
      this.saveDraft();
    }
  }

  hasActivityLayer(): boolean {
    return this.farmVisits.length > 0 || this.trainingSessions.length > 0;
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.reportForm.get('weekNumber')?.valid &&
               this.reportForm.get('year')?.valid &&
               this.reportForm.get('weekStartDate')?.valid &&
               this.reportForm.get('weekEndDate')?.valid &&
               this.reportForm.get('challenges')?.valid &&
               this.reportForm.get('commonFindings')?.valid);
      case 2:
        return this.isFarmVisitLayerValid();
      case 3:
        return this.hasActivityLayer() &&
               this.isFarmVisitLayerValid() &&
               (this.trainingSessions.length === 0 || this.areTrainingSessionsValid());
      case 4:
        return this.hasEvidenceAttached();
      default:
        return false;
    }
  }

  canSubmit(): boolean {
    const hasEvidence = this.hasEvidenceAttached();
    return this.isStepValid(1) &&
           this.hasActivityLayer() &&
           this.isFarmVisitLayerValid() &&
           (this.trainingSessions.length === 0 || this.areTrainingSessionsValid()) &&
           hasEvidence &&
           !this.submitting();
  }

  loadReportForResubmit(reportId: string): void {
    this.loadingReport.set(true);
    this.foDashboard.getReportDetails(reportId).subscribe({
      next: (response) => {
        const raw = response?.data ?? response;
        this.prefillFormFromReport(raw);
        this.loadingReport.set(false);
      },
      error: () => {
        this.loadingReport.set(false);
        this.errorModal.show('Load Failed', 'Unable to load report for resubmission.');
        this.router.navigate(['/fo/my-reports']);
      }
    });
  }

  prefillFormFromReport(raw: any): void {
    const farmerVisits = raw.farmerVisits ?? raw.FarmerVisits ?? [];
    const trainingSessions = (raw.trainingSessions ?? raw.TrainingSessions ?? []).map((s: any) => ({
      ...s,
      attendances: s.attendances ?? s.Attendances ?? []
    }));
    const evidences = raw.evidences ?? raw.Evidences ?? [];
    const firstEvidence = evidences[0];

    this.rejectionReason.set(raw.rejectionReason ?? null);
    if (firstEvidence) {
      const evidence: ExistingEvidence = {
        id: firstEvidence.id ?? firstEvidence.Id ?? '',
        originalFileName: firstEvidence.originalFileName ?? firstEvidence.OriginalFileName ?? 'Evidence file',
        downloadUrl: firstEvidence.downloadUrl ?? firstEvidence.DownloadUrl ?? '',
        contentType: firstEvidence.contentType ?? firstEvidence.ContentType ?? 'image/jpeg'
      };
      this.existingEvidence.set(evidence);
      this.loadExistingEvidencePreview(evidence);
    }

    this.reportForm.patchValue({
      weekNumber: raw.weekNumber,
      year: raw.year,
      weekStartDate: this.toDateInputValue(raw.weekStartDate),
      weekEndDate: this.toDateInputValue(raw.weekEndDate),
      challenges: raw.challenges ?? '',
      commonFindings: raw.commonFindings ?? '',
      evidenceType: firstEvidence?.evidenceType ?? raw.evidenceType ?? 'ProofofVisitPhoto'
    });

    this.farmVisits.clear();
    if (farmerVisits.length > 0) {
      this.showFarmVisitSetup.set(true);
      farmerVisits.forEach((visit: any) => {
        const visitGroup = this.createFarmVisit();
        visitGroup.patchValue({
          title: visit.title ?? visit.topic ?? '',
          tag: visit.farmerId ?? visit.tag ?? '',
          farmerName: visit.farmerName ?? '',
          visitDate: this.toDateInputValue(visit.visitDate),
          notes: visit.notes ?? ''
        });
        this.farmVisits.push(visitGroup);
      });
    }

    this.trainingSessions.clear();
    trainingSessions.forEach((session: any) => {
      const sessionGroup = this.createTrainingSession();
      sessionGroup.patchValue({
        title: session.title ?? '',
        sessionDate: this.toDateInputValue(session.sessionDate),
        category: this.normalizeCategory(session.category)
      });

      const attendancesArray = sessionGroup.get('attendances') as FormArray;
      (session.attendances ?? []).forEach((attendance: any) => {
        const attendanceGroup = this.createAttendance();
        attendanceGroup.patchValue({
          attendeeName: attendance.attendeeName ?? '',
          attendeeId: attendance.attendeeId ?? ''
        });
        attendancesArray.push(attendanceGroup);
      });

      this.trainingSessions.push(sessionGroup);
    });

    this.refreshNavigationState();
  }

  private toDateInputValue(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  onSubmit(): void {
    if (this.isResubmitMode()) {
      this.onResubmit();
      return;
    }
    if (!this.canSubmit()) {
      this.toast.show('Validation Error', 'Please complete all required fields', 'error');
      return;
    }

    const file = this.selectedFile();
    if (!file) {
      this.toast.show('Validation Error', 'Evidence file is required', 'error');
      return;
    }

    this.submitting.set(true);
    const formValue = this.reportForm.value;

    const farmVisits = formValue.farmVisits.map((visit: any) => ({
      farmerId: visit.tag,
      farmerName: visit.farmerName,
      title: visit.title,
      visitDate: visit.visitDate,
      notes: visit.notes
    }));

    const trainingSessions = formValue.trainingSessions.map((session: any) => ({
      ...session,
      category: Number(session.category)
    }));

    const payload: WeeklyReportSubmitPayload = {
      weekNumber: formValue.weekNumber,
      year: formValue.year,
      weekStartDate: formValue.weekStartDate,
      weekEndDate: formValue.weekEndDate,
      challenges: formValue.challenges,
      commonFindings: formValue.commonFindings,
      farmerVisitsJson: JSON.stringify(farmVisits),
      trainingSessionsJson: JSON.stringify(trainingSessions),
      taskRecordsJson: JSON.stringify([]),
      evidenceType: formValue.evidenceType,
      evidenceFile: file
    };

    void this.offlineSync.submitWeeklyReport(payload).then(result => {
      this.submitting.set(false);
      this.clearDraft();

      if (result === 'queued') {
        this.toast.show(
          'Saved Offline',
          'Report saved on this device. It will submit automatically when you have internet.',
          'success',
          6000
        );
      } else {
        this.toast.show('Success', 'Weekly report submitted successfully!', 'success');
      }

      this.router.navigate(['/fo/my-reports']);
    }).catch((err: unknown) => {
      this.submitting.set(false);
      this.errorModal.show('Submission Error', extractErrorMessage(err));
    });
  }

  onResubmit(): void {
    if (!this.canSubmit()) {
      this.toast.show('Validation Error', 'Please complete all required fields', 'error');
      return;
    }

    const reportId = this.resubmitReportId();
    if (!reportId) return;

    this.submitting.set(true);
    const formValue = this.reportForm.value;
    const file = this.selectedFile();

    const farmVisits = formValue.farmVisits.map((visit: any) => ({
      farmerId: visit.tag,
      farmerName: visit.farmerName,
      title: visit.title,
      visitDate: visit.visitDate,
      notes: visit.notes
    }));

    const trainingSessions = formValue.trainingSessions.map((session: any) => ({
      ...session,
      category: Number(session.category)
    }));

    this.foDashboard.resubmitReport(reportId, {
      challenges: formValue.challenges,
      commonFindings: formValue.commonFindings,
      farmerVisitsJson: JSON.stringify(farmVisits),
      trainingSessionsJson: JSON.stringify(trainingSessions),
      taskRecordsJson: JSON.stringify([]),
      evidenceType: formValue.evidenceType,
      evidenceFile: file ?? undefined
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toast.show('Success', res.message || 'Report resubmitted successfully!', 'success');
        this.router.navigate(['/fo/report-details', reportId]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorModal.show('Resubmission Error', extractErrorMessage(err));
      }
    });
  }
}
