'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib/utils';

// Chart components
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: Record<string, { label: string; color: string }>;
  }
>(({ className, config, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col', className)}
    {...props}
  >
    {children}
  </div>
));
ChartContainer.displayName = 'ChartContainer';

const ChartTooltip = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border bg-background p-2 shadow-lg">
    {children}
  </div>
);

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      className,
      hideLabel = false,
      hideIndicator = false,
      indicator = 'line',
      nameKey,
      labelKey,
      children,
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border bg-background p-2 shadow-lg',
        className,
      )}
    >
      {children}
    </div>
  ),
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

const ChartLegend = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-2">{children}</div>
);

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    hideIcon?: boolean;
    nameKey?: string;
  }
>(
  (
    { className, hideIcon = false, nameKey, children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ChartLegendContent.displayName = 'ChartLegendContent';

const ChartStyle = ({ id, config }: { id: string; config: Record<string, { color: string }> }) => {
  const styles = Object.entries(config).map(([key, value]) => {
    return `
      .chart-${key} {
        --color-${key}: ${value.color};
      }
    `;
  });

  return (
    <style>
      {styles.join('')}
    </style>
  );
};

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  AreaChart,
  BarChart,
  LineChart,
  RechartsPieChart as PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Bar,
  Line,
  Pie,
  Cell,
  Label,
  LabelList,
  ResponsiveContainer,
};