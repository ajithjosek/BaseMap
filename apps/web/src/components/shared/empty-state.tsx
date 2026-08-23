import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ icon, message, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-slate-300 mb-3" aria-hidden="true">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <p className="text-sm text-slate-500 max-w-sm">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
