import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OfflineReportSyncService } from '../../../core/services/offline-report-sync.service';
import { ToastService } from '../../../core/services/toast.service';
import { WeeklyReportSubmitPayload } from '../../../core/models/offline-report.models';
import { debounceTime, distinctUntilChanged, merge } from 'rxjs';

interface DraftData {
  formValue: any;
  currentStep: number;
  selectedFileName?: string;
  timestamp: number;
}

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-report.component.html',
  styleUrls: ['./create-report.component.css']
})
export class CreateReportComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  readonly offlineSync = inject(OfflineReportSyncService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private readonly DRAFT_KEY = 'weekly_report_draft';
  private autoSaveSubscription: any;

  reportForm!: FormGroup;
  currentStep = signal(1);
  submitting = signal(false);
  selectedFile = signal<File | null>(null);
  hasDraft = signal(false);
  showFarmVisitSetup = signal(false);
  canProceedToNext = signal(false);

  readonly categoryOptions = [
    { value: 1, label: 'GAP' },
    { value: 2, label: 'GEP' },
    { value: 3, label: 'GSP' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkForDraft();
    this.setupAutoSave();
    this.setupNavigationRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.reportForm = this.fb.group({
      weekNumber: [null, [Validators.required, Validators.min(1), Validators.max(53)]],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
      weekStartDate: ['', Validators.required],
      weekEndDate: ['', Validators.required],
      challenges: ['', Validators.required],
      commonFindings: ['', Validators.required],
      farmVisitTopic: [''],
      farmVisitCategory: [null as number | null],
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
        farmVisitTopic: formValue.farmVisitTopic ?? formValue.farmVisits?.[0]?.topic ?? '',
        farmVisitCategory: this.normalizeCategory(
          formValue.farmVisitCategory ?? formValue.farmVisits?.[0]?.category
        ),
        evidenceType: formValue.evidenceType ?? 'ProofofVisitPhoto'
      });

      if (formValue.farmVisits && formValue.farmVisits.length > 0) {
        this.showFarmVisitSetup.set(true);
        formValue.farmVisits.forEach((visit: any) => {
          const visitGroup = this.createFarmVisit();
          visitGroup.patchValue({
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
      this.updateFarmVisitSharedValidators();
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

  private updateFarmVisitSharedValidators(): void {
    const topic = this.reportForm.get('farmVisitTopic');
    const category = this.reportForm.get('farmVisitCategory');
    const requireSharedFields = this.farmVisits.length > 0;

    if (requireSharedFields) {
      topic?.setValidators(Validators.required);
      category?.setValidators(Validators.required);
    } else {
      topic?.clearValidators();
      category?.clearValidators();
    }

    topic?.updateValueAndValidity({ emitEvent: false });
    category?.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeCategory(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const category = Number(value);
    return category === 1 || category === 2 || category === 3 ? category : null;
  }

  private hasFarmVisitCategory(): boolean {
    return this.normalizeCategory(this.reportForm.get('farmVisitCategory')?.value) !== null;
  }

  private hasFarmVisitTopic(): boolean {
    const value = this.reportForm.get('farmVisitTopic')?.value;
    return typeof value === 'string' && value.trim().length > 0;
  }

  saveDraft(): void {
    if (this.reportForm.pristine) return;

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
      tag: ['', Validators.required],
      farmerName: ['', Validators.required],
      visitDate: ['', Validators.required],
      notes: ['', Validators.required]
    });
  }

  openFarmVisitSetup(): void {
    this.showFarmVisitSetup.set(true);
    this.refreshNavigationState();
  }

  selectFarmVisitCategory(value: number): void {
    this.reportForm.get('farmVisitCategory')?.setValue(value);
    this.reportForm.get('farmVisitCategory')?.markAsTouched();
    this.refreshNavigationState();
  }

  addFarmVisit(): void {
    const topicCtrl = this.reportForm.get('farmVisitTopic');
    topicCtrl?.markAsTouched();
    this.reportForm.get('farmVisitCategory')?.markAsTouched();

    if (!this.hasFarmVisitTopic() || !this.hasFarmVisitCategory()) {
      this.toast.show('Validation Error', 'Please set Topic and Category before adding a farm visit.', 'error');
      return;
    }

    this.farmVisits.push(this.createFarmVisit());
    this.updateFarmVisitSharedValidators();
    this.refreshNavigationState();
  }

  removeFarmVisit(index: number): void {
    this.farmVisits.removeAt(index);
    if (this.farmVisits.length === 0) {
      this.showFarmVisitSetup.set(false);
    }
    this.updateFarmVisitSharedValidators();
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
      this.selectedFile.set(input.files[0]);
      this.refreshNavigationState();
    }
  }

  isFieldInvalid(group: AbstractControl, field: string): boolean {
    const control = group.get(field);
    return !!(control && control.invalid && control.touched);
  }

  isSharedFarmFieldInvalid(field: string): boolean {
    const control = this.reportForm.get(field);
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

    if (!this.hasFarmVisitTopic() || !this.hasFarmVisitCategory()) {
      return false;
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
      this.reportForm.get('farmVisitTopic')?.markAsTouched();
      this.reportForm.get('farmVisitCategory')?.markAsTouched();
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
        return !!this.selectedFile();
      default:
        return false;
    }
  }

  canSubmit(): boolean {
    return this.isStepValid(1) &&
           this.hasActivityLayer() &&
           this.isFarmVisitLayerValid() &&
           (this.trainingSessions.length === 0 || this.areTrainingSessionsValid()) &&
           !!this.selectedFile() &&
           !this.submitting();
  }

  onSubmit(): void {
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
      tag: visit.tag,
      farmerName: visit.farmerName,
      visitDate: visit.visitDate,
      topic: formValue.farmVisitTopic,
      category: Number(formValue.farmVisitCategory),
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
    }).catch((err: Error) => {
      this.submitting.set(false);
      this.toast.show('Submission Error', err.message || 'Failed to submit report', 'error');
    });
  }
}
