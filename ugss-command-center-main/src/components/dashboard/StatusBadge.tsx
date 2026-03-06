import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const statusVariantMap: Record<string, StatusVariant> = {
  // Complaint statuses
  'Resolved': 'success',
  'In Progress': 'info',
  'Assigned': 'warning',
  'Submitted': 'neutral',
  
  // Equipment statuses
  'Running': 'success',
  'Standby': 'neutral',
  'Maintenance': 'warning',
  'Fault': 'danger',
  
  // Compliance
  'Compliant': 'success',
  'Non-Compliant': 'danger',
  'Pending': 'warning',
  
  // General
  'Active': 'success',
  'Inactive': 'neutral',
  'On Leave': 'warning',
  'Training': 'info',
  
  // Levels
  'Normal': 'success',
  'High': 'warning',
  'Low': 'info',
  'Critical': 'danger',
  
  // Housekeeping
  'Excellent': 'success',
  'Good': 'success',
  'Average': 'warning',
  'Poor': 'danger',
  
  // Maintenance
  'Up to Date': 'success',
  'Due': 'warning',
  'Overdue': 'danger',
  
  // Risk levels
  'Medium': 'warning',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariantMap[status] || 'neutral';

  return (
    <span className={cn('status-badge', resolvedVariant)}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        resolvedVariant === 'success' && 'bg-success',
        resolvedVariant === 'warning' && 'bg-warning',
        resolvedVariant === 'danger' && 'bg-destructive',
        resolvedVariant === 'info' && 'bg-info',
        resolvedVariant === 'neutral' && 'bg-muted-foreground',
      )} />
      {status}
    </span>
  );
}
