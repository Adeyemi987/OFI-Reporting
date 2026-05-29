# Weekly Report Creation Feature - Implementation Guide

## Overview
Complete implementation of the FO (Field Officer) Weekly Report Creation workflow with multi-step reactive forms, nested data structures, geolocation capture, and file upload capabilities.

## Features Implemented

### 1. Multi-Step Reactive Form (4 Steps)
- **Step 1: Basic Information**
  - Week Number (1-53)
  - Year
  - Week Start Date
  - Week End Date
  - Challenges (textarea)
  - Common Findings (textarea)

- **Step 2: Farm Visits**
  - Dynamic FormArray for multiple farm visits
  - Each visit includes:
    - Farmer ID
    - Farmer Name
    - Visit Date
    - Location
    - Notes
  - Add/Remove farm visits dynamically

- **Step 3: Training Sessions & Task Records**
  - **Training Sessions** (FormArray):
    - Title
    - Location
    - Session Date
    - Category (GAP/GEP/GSP)
    - Nested Attendances (FormArray):
      - Attendee Name
      - Attendee ID
  - **Task Records** (FormArray):
    - Title
    - Description
    - Category (GAP/GEP/GSP)
    - Is Completed (checkbox)
    - Completed Date (conditional - required if completed)

- **Step 4: Evidence Upload**
  - File upload (image)
  - Evidence Type: GeotaggedPhoto (fixed)
  - Geolocation capture (required)
  - GPS coordinates display

### 2. Validation Rules
- All fields marked with asterisk (*) are required
- Week number must be between 1-53
- Year must be >= 2020
- At least one farm visit required
- At least one training session required
- At least one task record required
- File upload required
- Geolocation required for GeotaggedPhoto evidence type
- Completed date required when task is marked as completed
- Real-time inline validation with error messages
- Step-by-step validation (can't proceed without valid data)

### 3. Geolocation Integration
- Browser geolocation API integration
- High accuracy GPS capture
- Permission handling
- Error messages for:
  - Permission denied
  - Position unavailable
  - Timeout
- Display captured coordinates with accuracy
- Visual feedback during capture

### 4. Submission Flow
- POST to `/api/Reports` endpoint
- multipart/form-data format
- Fields submitted:
  - weekNumber
  - year
  - weekStartDate
  - weekEndDate
  - challenges
  - commonFindings
  - farmerVisitsJson (stringified JSON)
  - trainingSessionsJson (stringified JSON)
  - taskRecordsJson (stringified JSON)
  - evidenceFile (file)
  - evidenceType
  - latitude
  - longitude
- Loading state during submission
- Success/error toast notifications
- Redirect to My Reports on success

### 5. My Reports Component
- Display all submitted reports
- Status tracking:
  - Submitted (blue)
  - UnderReview (orange)
  - Approved (green)
  - Rejected (red)
- Report cards showing:
  - Week number and year
  - Date range
  - Status badge
  - Statistics (farmers visited, tasks, training sessions)
  - Submission date
  - Rejection reason (if rejected)
- Empty state with call-to-action
- Loading and error states
- Responsive grid layout

## File Structure

```
src/app/features/fo/
├── create-report/
│   ├── create-report.component.ts      # Main component with form logic
│   ├── create-report.component.html    # Multi-step form template
│   └── create-report.component.css     # Styled form UI
├── my-reports/
│   └── my-reports.component.ts         # Reports list with status tracking
└── fo-dashboard/
    └── fo-dashboard.component.ts       # Dashboard with KPIs and recent reports
```

## Key Technologies Used

- **Angular 18+** with standalone components
- **Reactive Forms** with FormBuilder, FormGroup, FormArray
- **Signals** for reactive state management
- **HttpClient** for API communication
- **Geolocation Service** for GPS capture
- **Toast Service** for notifications
- **Router** for navigation

## Usage Instructions

### Creating a Report

1. Navigate to `/fo/fo-dashboard`
2. Click "Create Weekly Report" button
3. **Step 1**: Fill in basic information
   - Enter week number (1-53)
   - Select year
   - Choose start and end dates
   - Describe challenges and findings
   - Click "Next"

4. **Step 2**: Add farm visits
   - Click "Add Farm Visit"
   - Fill in farmer details
   - Add multiple visits as needed
   - Click "Next"

5. **Step 3**: Add training sessions and tasks
   - Click "Add Training Session"
   - Fill in session details
   - Add attendees for each session
   - Click "Add Task"
   - Fill in task details
   - Mark as completed if applicable
   - Click "Next"

6. **Step 4**: Upload evidence
   - Click "Choose file" to select image
   - Click "Capture Location" to get GPS coordinates
   - Allow location permission when prompted
   - Verify coordinates are captured
   - Click "Submit Report"

7. View confirmation and redirect to My Reports

### Viewing Reports

1. Navigate to `/fo/my-reports`
2. View all submitted reports with status
3. Check rejection reasons if applicable
4. Click "Create New Report" to submit another

## API Integration

### Submit Report Endpoint
```
POST /api/Reports
Content-Type: multipart/form-data

Body:
- weekNumber: number
- year: number
- weekStartDate: string (ISO date)
- weekEndDate: string (ISO date)
- challenges: string
- commonFindings: string
- farmerVisitsJson: string (JSON array)
- trainingSessionsJson: string (JSON array)
- taskRecordsJson: string (JSON array)
- evidenceFile: File
- evidenceType: string
- latitude: number
- longitude: number
```

### Get My Reports Endpoint
```
GET /api/Reports/my-reports

Response: Report[]
```

## Business Rules Enforced

1. ✅ All required fields must be filled
2. ✅ Submit button disabled until form is valid
3. ✅ Angular Reactive Forms with FormArray for nested structures
4. ✅ Nested data validation (farm visits, training sessions, task records)
5. ✅ Inline validation with error messages
6. ✅ Toast feedback on success/error
7. ✅ Geolocation required for GeotaggedPhoto evidence type
8. ✅ Block submission if location permission denied
9. ✅ Report status tracking (Submitted, Reviewed, Approved, Rejected)
10. ✅ Reports automatically appear on FC dashboard

## Styling Features

- Modern gradient backgrounds
- Card-based layouts
- Step indicator with progress visualization
- Responsive design (mobile-friendly)
- Smooth transitions and hover effects
- Color-coded status badges
- Icon-based visual feedback
- Loading spinners
- Empty states with illustrations

## Error Handling

- Form validation errors displayed inline
- Geolocation permission errors with helpful messages
- API submission errors with toast notifications
- Network error handling
- File upload validation
- Required field indicators

## Accessibility

- Semantic HTML structure
- Proper form labels
- Required field indicators
- Error messages associated with inputs
- Keyboard navigation support
- Focus states on interactive elements

## Performance Optimizations

- Lazy-loaded routes
- Standalone components
- OnPush change detection where applicable
- Signal-based reactivity
- Efficient form validation

## Testing Checklist

- [ ] Create report with all required fields
- [ ] Add multiple farm visits
- [ ] Add multiple training sessions with attendees
- [ ] Add multiple task records
- [ ] Mark tasks as completed/incomplete
- [ ] Upload evidence file
- [ ] Capture geolocation
- [ ] Submit report successfully
- [ ] View submitted reports
- [ ] Check status badges
- [ ] Test validation errors
- [ ] Test geolocation permission denial
- [ ] Test API error handling
- [ ] Test responsive design on mobile
- [ ] Test navigation between steps

## Future Enhancements

- Edit submitted reports (before approval)
- Delete draft reports
- Offline support with local storage
- Photo preview before upload
- Multiple file uploads
- Export reports to PDF
- Advanced filtering and search
- Report analytics dashboard
- Push notifications for status changes

## Support

For issues or questions, contact the development team or refer to the main project documentation.
