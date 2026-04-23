import React from 'react';
import { COMMAND_PANEL, cn } from '@/lib/tokens';

export function CommandChartCard({
  title,
  subtitle,
  children,
  className = '',
  action = null
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn(COMMAND_PANEL, 'flex flex-col p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/[0.4]">{title}</div>
          {subtitle && <div className="mt-1 text-[12px] text-white/50">{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
