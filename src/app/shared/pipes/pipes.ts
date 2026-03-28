import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: string): string {
    const labels: Record<string, string> = {
      pending_fc:  'Pending',
      pending_pc:  'Pending',
      pending_gl:  'Pending',
      pending_csh: 'Pending',
      pending_sh:  'Pending',
      pending_ch:  'Pending',
      approved:    'Approved',
      rejected:    'Rejected',
    };
    return labels[status] ?? status;
  }
}

@Pipe({ name: 'numberShort', standalone: true })
export class NumberShortPipe implements PipeTransform {
  transform(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  }
}
