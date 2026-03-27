import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  DashboardSummary, SubordinateReport, ApprovalStatus,
  AuditLog, Task, TrainingSession, DownloadOptions, UserRole
} from '../models';

// ─── Mock data factory ─────────────────────────────────────────────────────────
function makeAuditLogs(count: number, approverName: string, role: UserRole): AuditLog[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `log_${i}`,
    action: i === 0 ? 'Report Approved' : i === 1 ? 'Report Modified' : 'Report Submitted',
    performedBy: approverName,
    performedByRole: role,
    timestamp: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    comments: i === 0 ? 'All checks passed. Data validated.' : undefined
  }));
}

function makeTasks(count: number): Task[] {
  const categories: Array<'GAP' | 'GEP' | 'GSP'> = ['GAP', 'GEP', 'GSP'];
  const titles = ['Farm inspection', 'Soil testing', 'Pesticide training', 'Irrigation review', 'Harvest assessment', 'Crop monitoring', 'Water quality check', 'Seedling distribution'];
  const total = Math.max(count, 24);
  return Array.from({ length: total }, (_, i) => ({
    id: `task_${i}`,
    title: titles[i % titles.length],
    category: categories[i % 3],
    farmersVisited: Math.floor(Math.random() * 15) + 1,
    completedDate: new Date(Date.now() - i * 86400000 * 15).toISOString().split('T')[0],
    location: `Zone ${String.fromCharCode(65 + (i % 5))}`,
    notes: i % 2 === 0 ? 'Completed as scheduled' : undefined
  }));
}

function makeTrainingSessions(count: number): TrainingSession[] {
  const categories: Array<'GAP' | 'GEP' | 'GSP'> = ['GAP', 'GEP', 'GSP'];
  const titles = ['Sustainable Farming Practices', 'Pest Management', 'Quality Standards', 'Climate Adaptation', 'Soil Conservation', 'Organic Methods'];
  const total = Math.max(count, 12);
  return Array.from({ length: total }, (_, i) => ({
    id: `ts_${i}`,
    title: titles[i % titles.length],
    date: new Date(Date.now() - i * 86400000 * 30).toISOString().split('T')[0],
    participants: Math.floor(Math.random() * 30) + 5,
    category: categories[i % 3],
    location: `Training Center ${i + 1}`
  }));
}

function buildSubordinate(
  id: string, name: string, role: UserRole,
  status: ApprovalStatus, approver?: string, approverRole?: UserRole
): SubordinateReport {
  const tasks = makeTasks(6);
  const gap = tasks.filter(t => t.category === 'GAP').length;
  const gep = tasks.filter(t => t.category === 'GEP').length;
  const gsp = tasks.filter(t => t.category === 'GSP').length;
  const farmers = tasks.reduce((s, t) => s + t.farmersVisited, 0);

  return {
    userId: id,
    fullName: name,
    role,
    farmersVisited: farmers,
    gapCount: gap,
    gepCount: gep,
    gspCount: gsp,
    status,
    approvalDate: status === 'approved' ? new Date(Date.now() - 86400000).toISOString() : undefined,
    approvedBy: approver,
    auditLogs: makeAuditLogs(3, approver ?? 'System', approverRole ?? role),
    tasks,
    trainingSessions: makeTrainingSessions(3),
    isExpanded: false
  };
}

const MOCK_DATA: Record<UserRole, DashboardSummary> = {
  FO: {
    totalSubordinates: 0,
    totalFarmersVisited: 42,
    totalGAP: 3,
    totalGEP: 2,
    totalGSP: 1,
    pendingApprovals: 0,
    approvedCount: 0,
    canApprove: false,
    lastUpdated: new Date().toISOString(),
    subordinates: []
  },
  FC: {
    totalSubordinates: 4,
    totalFarmersVisited: 168,
    totalGAP: 12,
    totalGEP: 8,
    totalGSP: 6,
    pendingApprovals: 1,
    approvedCount: 3,
    canApprove: false,
    lastUpdated: new Date().toISOString(),
    subordinates: [
      buildSubordinate('fo1', 'Ama Mensah', 'FO', 'approved', 'Kofi Asante', 'FC'),
      buildSubordinate('fo2', 'James Kumi', 'FO', 'approved', 'Kofi Asante', 'FC'),
      buildSubordinate('fo3', 'Priscilla Tetteh', 'FO', 'approved', 'Kofi Asante', 'FC'),
      buildSubordinate('fo4', 'Daniel Agyei', 'FO', 'pending'),
    ]
  },
  PC: {
    totalSubordinates: 3,
    totalFarmersVisited: 512,
    totalGAP: 38,
    totalGEP: 26,
    totalGSP: 22,
    pendingApprovals: 0,
    approvedCount: 3,
    canApprove: true,
    lastUpdated: new Date().toISOString(),
    subordinates: [
      buildSubordinate('fc1', 'Kofi Asante', 'FC', 'approved', 'Abena Ofori', 'PC'),
      buildSubordinate('fc2', 'Efua Hanson', 'FC', 'approved', 'Abena Ofori', 'PC'),
      buildSubordinate('fc3', 'Samuel Boadu', 'FC', 'approved', 'Abena Ofori', 'PC'),
    ]
  },
  GL: {
    totalSubordinates: 4,
    totalFarmersVisited: 1840,
    totalGAP: 128,
    totalGEP: 96,
    totalGSP: 74,
    pendingApprovals: 1,
    approvedCount: 3,
    canApprove: false,
    lastUpdated: new Date().toISOString(),
    subordinates: [
      buildSubordinate('pc1', 'Abena Ofori', 'PC', 'approved', 'Emmanuel Darko', 'GL'),
      buildSubordinate('pc2', 'Yaw Adjei', 'PC', 'approved', 'Emmanuel Darko', 'GL'),
      buildSubordinate('pc3', 'Esi Addo', 'PC', 'approved', 'Emmanuel Darko', 'GL'),
      buildSubordinate('pc4', 'Kweku Antwi', 'PC', 'pending'),
    ]
  },
  CSH: {
    totalSubordinates: 3,
    totalFarmersVisited: 5520,
    totalGAP: 392,
    totalGEP: 288,
    totalGSP: 224,
    pendingApprovals: 0,
    approvedCount: 3,
    canApprove: true,
    lastUpdated: new Date().toISOString(),
    subordinates: [
      buildSubordinate('gl1', 'Emmanuel Darko', 'GL', 'approved', 'Akosua Boateng', 'CSH'),
      buildSubordinate('gl2', 'Nana Owusu', 'GL', 'approved', 'Akosua Boateng', 'CSH'),
      buildSubordinate('gl3', 'Adwoa Sarpong', 'GL', 'approved', 'Akosua Boateng', 'CSH'),
    ]
  },
  SH: {
    totalSubordinates: 2,
    totalFarmersVisited: 11040,
    totalGAP: 784,
    totalGEP: 576,
    totalGSP: 448,
    pendingApprovals: 0,
    approvedCount: 2,
    canApprove: true,
    lastUpdated: new Date().toISOString(),
    subordinates: [
      buildSubordinate('csh1', 'Akosua Boateng', 'CSH', 'approved', 'Kwame Mensah', 'SH'),
      buildSubordinate('csh2', 'Fiifi Larbi', 'CSH', 'approved', 'Kwame Mensah', 'SH'),
    ]
  },
  CH: {
    totalSubordinates: 2,
    totalFarmersVisited: 22080,
    totalGAP: 1568,
    totalGEP: 1152,
    totalGSP: 896,
    pendingApprovals: 0,
    approvedCount: 2,
    canApprove: true,
    lastUpdated: new Date().toISOString(),
    subordinates: [
      buildSubordinate('sh1', 'Kwame Mensah', 'SH', 'approved', 'Dr. Amara Osei', 'CH'),
      buildSubordinate('sh2', 'Serwa Ntiamoah', 'SH', 'approved', 'Dr. Amara Osei', 'CH'),
    ]
  }
};

@Injectable({ providedIn: 'root' })
export class DashboardService {

  getDashboard(role: UserRole): Observable<DashboardSummary> {
    return of(JSON.parse(JSON.stringify(MOCK_DATA[role]))).pipe(delay(600));
  }

  approve(role: UserRole, approverName: string): Observable<{ success: boolean; message: string }> {
    return of({ success: true, message: 'Report approved and promoted to next level.' }).pipe(delay(1200));
  }

  downloadReport(options: DownloadOptions, data: SubordinateReport[]): void {
    const headers = options.type === 'farm-visits'
      ? ['Full Name', 'Role', 'Farmers Visited', 'GAP', 'GEP', 'GSP', 'Status', 'Approval Date', 'Approved By']
      : ['Full Name', 'Role', 'Training Title', 'Category', 'Date', 'Participants', 'Location'];

    let csvContent = headers.join(',') + '\n';

    if (options.type === 'farm-visits') {
      data.forEach(s => {
        csvContent += [
          `"${s.fullName}"`, s.role, s.farmersVisited,
          s.gapCount, s.gepCount, s.gspCount,
          s.status, s.approvalDate ?? '', s.approvedBy ?? ''
        ].join(',') + '\n';
      });
    } else {
      data.forEach(s => {
        s.trainingSessions.forEach(ts => {
          csvContent += [
            `"${s.fullName}"`, s.role, `"${ts.title}"`,
            ts.category, ts.date, ts.participants, `"${ts.location}"`
          ].join(',') + '\n';
        });
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ofi_${options.type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
