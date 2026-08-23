import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' | 'info';

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  // healthy states
  operational: 'success',
  active: 'success',
  healthy: 'success',
  approved: 'success',
  closed: 'success',
  compliant: 'success',
  completed: 'success',
  // degraded / in-progress states
  degraded: 'warning',
  draft: 'warning',
  pending: 'warning',
  pending_approval: 'warning',
  in_progress: 'warning',
  open: 'warning',
  review: 'warning',
  maintenance: 'warning',
  medium: 'warning',
  low: 'info',
  // failing states
  down: 'destructive',
  deprecated: 'destructive',
  error: 'destructive',
  critical: 'destructive',
  failed: 'destructive',
  overdue: 'destructive',
  non_compliant: 'destructive',
  high: 'destructive',
  blocked: 'destructive',
  // neutral states
  retired: 'secondary',
  inactive: 'secondary',
  archived: 'secondary',
  on_hold: 'secondary',
  cancelled: 'secondary',
  // future states
  planned: 'info',
  scheduled: 'info',
};

function normalize(status: string): string {
  return status.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations('status');
  const key = normalize(status);
  const variant = STATUS_VARIANTS[key] ?? 'outline';
  return (
    <Badge variant={variant} className={cn('whitespace-nowrap', className)}>
      {t.has(key) ? t(key) : status}
    </Badge>
  );
}
