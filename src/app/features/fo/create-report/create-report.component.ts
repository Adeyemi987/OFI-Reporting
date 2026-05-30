import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GeolocationService } from '../../../core/services/geolocation.service';
import { OfflineReportSyncService } from '../../../core/services/offline-report-sync.service';
import { ToastService } from '../../../core/services/toast.service';
import { WeeklyReportSubmitPayload } from '../../../core/models/offline-report.models';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';

interface DraftData {
  formValue: any;
  currentStep: number;
  selectedFileName?: string;
  timestamp: number;
}

interface PendingLocationResolve {
  type: 'farm' | 'training';
  index: number;
  latitude?: number;
  longitude?: number;
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
  private geoService = inject(GeolocationService);
  readonly offlineSync = inject(OfflineReportSyncService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private readonly DRAFT_KEY = 'weekly_report_draft';
  private readonly PENDING_LOCATIONS_KEY = 'pending_location_resolves';
  private autoSaveSubscription: any;
  private readonly onOnline = (): void => { this.processPendingLocations(); };

  reportForm!: FormGroup;
  currentStep = signal(1);
  submitting = signal(false);
  selectedFile = signal<File | null>(null);
  locationLoading = signal<{ type: 'farm' | 'training'; index: number } | null>(null);
  hasDraft = signal(false);

  readonly categoryOptions = [
    { value: 1, label: 'GAP' },
    { value: 2, label: 'GEP' },
    { value: 3, label: 'GSP' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkForDraft();
    this.setupAutoSave();
    window.addEventListener('online', this.onOnline);
    this.processPendingLocations();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onOnline);
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
      farmVisits: this.fb.array([]),
      trainingSessions: this.fb.array([]),
      taskRecords: this.fb.array([]),
      evidenceType: ['GeotaggedPhoto', Validators.required]
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
        evidenceType: formValue.evidenceType
      });

      if (formValue.farmVisits && formValue.farmVisits.length > 0) {
        formValue.farmVisits.forEach((visit: any) => {
          const visitGroup = this.createFarmVisit();
          visitGroup.patchValue({
            farmerId: visit.farmerId,
            farmerName: visit.farmerName,
            visitDate: visit.visitDate,
            topic: visit.topic,
            category: visit.category,
            location: visit.location,
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
            location: session.location,
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
      farmerId: ['', Validators.required],
      farmerName: ['', Validators.required],
      visitDate: ['', Validators.required],
      topic: ['', Validators.required],
      category: [null, Validators.required],
      location: ['', Validators.required],
      notes: ['', Validators.required]
    });
  }

  addFarmVisit(): void {
    this.farmVisits.push(this.createFarmVisit());
  }

  removeFarmVisit(index: number): void {
    this.farmVisits.removeAt(index);
  }

  createTrainingSession(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      location: ['', Validators.required],
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
    }
  }

  isLocationLoading(type: 'farm' | 'training', index: number): boolean {
    const loading = this.locationLoading();
    return loading?.type === type && loading.index === index;
  }

  captureLocationName(type: 'farm' | 'training', index: number): void {
    if (!navigator.onLine) {
      this.queueLocationCapture(type, index);
      this.toast.show('Offline', 'Location will be detected when you\'re back online.', 'info', 4000);
      return;
    }

    this.locationLoading.set({ type, index });

    this.geoService.getCurrentPosition().subscribe({
      next: (position) => {
        this.geoService.reverseGeocode(position.latitude, position.longitude).subscribe({
          next: (placeName) => {
            this.setLocationValue(type, index, placeName);
            this.locationLoading.set(null);
            this.toast.show('Success', `Location set: ${placeName}`, 'success');
          },
          error: () => {
            this.queueLocationCapture(type, index, position);
            this.locationLoading.set(null);
            this.toast.show('Offline', 'Location will sync when network is available.', 'info', 4000);
          }
        });
      },
      error: (err) => {
        this.locationLoading.set(null);
        this.toast.show('Location Error', err.message, 'error');
      }
    });
  }

  private setLocationValue(type: 'farm' | 'training', index: number, placeName: string): void {
    const group = type === 'farm'
      ? this.farmVisits.at(index)
      : this.trainingSessions.at(index);
    group?.get('location')?.setValue(placeName);
  }

  private getPendingQueue(): PendingLocationResolve[] {
    try {
      const raw = localStorage.getItem(this.PENDING_LOCATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private queueLocationCapture(
    type: 'farm' | 'training',
    index: number,
    coords?: { latitude: number; longitude: number }
  ): void {
    const queue = this.getPendingQueue().filter(
      item => !(item.type === type && item.index === index)
    );
    queue.push({
      type,
      index,
      latitude: coords?.latitude,
      longitude: coords?.longitude
    });
    localStorage.setItem(this.PENDING_LOCATIONS_KEY, JSON.stringify(queue));
  }

  private async processPendingLocations(): Promise<void> {
    if (!navigator.onLine) return;

    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    const remaining: PendingLocationResolve[] = [];

    for (const entry of queue) {
      try {
        const placeName = entry.latitude != null && entry.longitude != null
          ? await firstValueFrom(this.geoService.reverseGeocode(entry.latitude, entry.longitude))
          : await firstValueFrom(this.geoService.resolveLocationName());

        if (this.isEntryValid(entry)) {
          this.setLocationValue(entry.type, entry.index, placeName);
        }
      } catch {
        if (this.isEntryValid(entry)) {
          remaining.push(entry);
        }
      }
    }

    localStorage.setItem(this.PENDING_LOCATIONS_KEY, JSON.stringify(remaining));

    if (queue.length > remaining.length) {
      this.toast.show('Location Synced', 'Pending locations have been updated.', 'success', 3000);
    }
  }

  private isEntryValid(entry: PendingLocationResolve): boolean {
    const array = entry.type === 'farm' ? this.farmVisits : this.trainingSessions;
    return entry.index >= 0 && entry.index < array.length;
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

  markStepTouched(step: number): void {
    if (step === 1) {
      Object.keys(this.reportForm.controls).forEach(key => {
        if (key !== 'farmVisits' && key !== 'trainingSessions' && key !== 'taskRecords') {
          this.reportForm.get(key)?.markAsTouched();
        }
      });
    }
    if (step === 2 || step === 3) {
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
      this.saveDraft();
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
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
        return this.farmVisits.length === 0 || this.farmVisits.valid;
      case 3:
        return this.hasActivityLayer() &&
               (this.farmVisits.length === 0 || this.farmVisits.valid) &&
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
           (this.farmVisits.length === 0 || this.farmVisits.valid) &&
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
      ...visit,
      category: Number(visit.category)
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
      this.clearPendingLocationsForForm();

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

  private clearPendingLocationsForForm(): void {
    localStorage.removeItem(this.PENDING_LOCATIONS_KEY);
  }
}
