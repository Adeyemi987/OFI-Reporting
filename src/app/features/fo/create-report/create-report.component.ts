import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GeolocationService, GeoLocation } from '../../../core/services/geolocation.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { debounceTime, distinctUntilChanged } from 'rxjs';

interface DraftData {
  formValue: any;
  currentStep: number;
  selectedFileName?: string;
  geoLocation?: GeoLocation;
  timestamp: number;
}

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-report.component.html',
  styleUrls: ['./create-report.component.css']
})
export class CreateReportComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private geoService = inject(GeolocationService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private readonly DRAFT_KEY = 'weekly_report_draft';
  private autoSaveSubscription: any;

  reportForm!: FormGroup;
  currentStep = signal(1);
  submitting = signal(false);
  selectedFile = signal<File | null>(null);
  geoLocation = signal<GeoLocation | null>(null);
  geoLoading = signal(false);
  hasDraft = signal(false);

  readonly categories = [
    { value: 1, label: 'GAP (Good Agricultural Practices)' },
    { value: 2, label: 'GEP (Good Environmental Practices)' },
    { value: 3, label: 'GSP (Good Social Practices)' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkForDraft();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  initForm(): void {
    const today = new Date().toISOString().split('T')[0];
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
          visitGroup.patchValue(visit);
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

      if (formValue.taskRecords && formValue.taskRecords.length > 0) {
        formValue.taskRecords.forEach((task: any) => {
          const taskGroup = this.createTaskRecord();
          taskGroup.patchValue(task);
          this.taskRecords.push(taskGroup);
        });
      }

      this.currentStep.set(draftData.currentStep);
      if (draftData.geoLocation) {
        this.geoLocation.set(draftData.geoLocation);
      }

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
      geoLocation: this.geoLocation() || undefined,
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

  createTaskRecord(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: [null, Validators.required],
      isCompleted: [false],
      completedDate: ['']
    });
  }

  addTaskRecord(): void {
    this.taskRecords.push(this.createTaskRecord());
  }

  removeTaskRecord(index: number): void {
    this.taskRecords.removeAt(index);
  }

  onTaskCompletedChange(index: number): void {
    const task = this.taskRecords.at(index);
    const isCompleted = task.get('isCompleted')?.value;
    const completedDateControl = task.get('completedDate');
    
    if (isCompleted) {
      completedDateControl?.setValidators(Validators.required);
      if (!completedDateControl?.value) {
        completedDateControl?.setValue(new Date().toISOString().split('T')[0]);
      }
    } else {
      completedDateControl?.clearValidators();
      completedDateControl?.setValue('');
    }
    completedDateControl?.updateValueAndValidity();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  captureGeolocation(): void {
    this.geoLoading.set(true);
    this.geoService.getCurrentPosition().subscribe({
      next: (location) => {
        this.geoLocation.set(location);
        this.geoLoading.set(false);
        this.toast.show('Success', `Location captured: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`, 'success');
      },
      error: (err) => {
        this.geoLoading.set(false);
        this.toast.show('Location Error', err.message, 'error');
      }
    });
  }

  nextStep(): void {
    if (this.currentStep() < 4) {
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
        return this.farmVisits.valid && this.farmVisits.length > 0;
      case 3:
        return this.trainingSessions.valid && this.taskRecords.valid &&
               this.trainingSessions.length > 0 && this.taskRecords.length > 0;
      case 4:
        return !!this.selectedFile() && !!this.geoLocation();
      default:
        return false;
    }
  }

  canSubmit(): boolean {
    return this.reportForm.valid && 
           this.farmVisits.length > 0 &&
           this.trainingSessions.length > 0 &&
           this.taskRecords.length > 0 &&
           !!this.selectedFile() && 
           !!this.geoLocation() &&
           !this.submitting();
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      this.toast.show('Validation Error', 'Please complete all required fields', 'error');
      return;
    }

    this.submitting.set(true);
    const formData = new FormData();
    const formValue = this.reportForm.value;

    const trainingSessions = formValue.trainingSessions.map((session: any) => ({
      ...session,
      category: Number(session.category)
    }));

    const taskRecords = formValue.taskRecords.map((task: any) => ({
      ...task,
      category: Number(task.category),
      completedDate: task.isCompleted ? task.completedDate : null
    }));

    formData.append('weekNumber', formValue.weekNumber.toString());
    formData.append('year', formValue.year.toString());
    formData.append('weekStartDate', formValue.weekStartDate);
    formData.append('weekEndDate', formValue.weekEndDate);
    formData.append('challenges', formValue.challenges);
    formData.append('commonFindings', formValue.commonFindings);
    formData.append('farmerVisitsJson', JSON.stringify(formValue.farmVisits));
    formData.append('trainingSessionsJson', JSON.stringify(trainingSessions));
    formData.append('taskRecordsJson', JSON.stringify(taskRecords));
    formData.append('evidenceType', formValue.evidenceType);
    
    if (this.selectedFile()) {
      formData.append('evidenceFile', this.selectedFile()!);
    }

    const geo = this.geoLocation();
    if (geo) {
      formData.append('latitude', geo.latitude.toString());
      formData.append('longitude', geo.longitude.toString());
    }

    this.http.post(`${environment.apiUrl}/api/Reports`, formData).subscribe({
      next: () => {
        this.clearDraft();
        this.toast.show('Success', 'Weekly report submitted successfully!', 'success');
        this.submitting.set(false);
        this.router.navigate(['/fo/my-reports']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.show('Submission Error', err.error?.message || 'Failed to submit report', 'error');
      }
    });
  }
}
