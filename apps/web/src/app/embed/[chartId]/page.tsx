'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CustomTreemap, CustomGantt } from '@/components/charts/AdvancedCharts';

const mockGanttData = [
  { id: '1', name: 'Phase 1', start: new Date('2026-06-01'), end: new Date('2026-08-15'), color: 'bg-indigo-500' },
  { id: '2', name: 'Phase 2', start: new Date('2026-08-01'), end: new Date('2026-12-31'), color: 'bg-rose-500' },
];

export default function EmbedChartPage() {
  const params = useParams();
  const chartId = params.chartId as string;

  // In a real scenario, fetch chart configuration by ID.
  // Here we'll just mock based on the ID for demonstration.
  
  return (
    <div className="w-full h-screen p-4 bg-white dark:bg-slate-950 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
          Embedded Chart: {chartId}
        </h3>
        <span className="text-xs text-slate-400">Powered by BaseMap</span>
      </div>
      
      <div className="flex-1 w-full border rounded shadow-inner p-4 bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {chartId === 'treemap' ? (
          <CustomTreemap data={[{ name: 'A', size: 100 }, { name: 'B', size: 200 }]} />
        ) : chartId === 'gantt' ? (
          <CustomGantt data={mockGanttData} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Invalid or missing chart configuration.
          </div>
        )}
      </div>
    </div>
  );
}
