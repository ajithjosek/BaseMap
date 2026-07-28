'use client';

import React, { useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip, Sankey } from 'recharts';

export const CustomTreemap = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#3b82f6"
      >
        <RechartsTooltip />
      </Treemap>
    </ResponsiveContainer>
  );
};

export const CustomSankey = ({ data }: { data: { nodes: any[], links: any[] } }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Sankey
        data={data}
        nodePadding={50}
        margin={{ top: 10, right: 200, bottom: 10, left: 200 }}
        link={{ stroke: '#94a3b8' }}
      >
        <RechartsTooltip />
      </Sankey>
    </ResponsiveContainer>
  );
};

export const CustomGantt = ({ data }: { data: { id: string, name: string, start: Date, end: Date, color?: string }[] }) => {
  const minDate = new Date(Math.min(...data.map(d => d.start.getTime())));
  const maxDate = new Date(Math.max(...data.map(d => d.end.getTime())));
  const totalDuration = maxDate.getTime() - minDate.getTime();

  return (
    <div className="w-full overflow-x-auto p-4 border rounded-lg bg-white dark:bg-slate-900">
      <div className="flex flex-col space-y-2 min-w-[800px]">
        {data.map((task, i) => {
          const leftPercent = ((task.start.getTime() - minDate.getTime()) / totalDuration) * 100;
          const widthPercent = ((task.end.getTime() - task.start.getTime()) / totalDuration) * 100;
          
          return (
            <div key={task.id} className="flex items-center text-sm h-8">
              <div className="w-48 truncate pr-4 font-medium dark:text-slate-200" title={task.name}>
                {task.name}
              </div>
              <div className="flex-1 relative h-6 bg-slate-100 dark:bg-slate-800 rounded">
                <div 
                  className={`absolute h-full rounded shadow-sm flex items-center px-2 text-xs text-white truncate ${task.color || 'bg-blue-500'}`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                >
                  {Math.round((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChartAnnotationWrapper = ({ children }: { children: React.ReactNode }) => {
  const [annotations, setAnnotations] = useState<{x: number, y: number, text: string}[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isAdding) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const text = prompt("Enter annotation text:");
    if (text) {
      setAnnotations([...annotations, { x, y, text }]);
    }
    setIsAdding(false);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`px-3 py-1 text-xs rounded shadow ${isAdding ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'}`}
        >
          {isAdding ? 'Click to place note' : 'Add Annotation'}
        </button>
      </div>
      
      <div 
        className="w-full h-full relative cursor-crosshair" 
        onClick={handleContainerClick}
        style={{ cursor: isAdding ? 'crosshair' : 'default' }}
      >
        {children}
        
        {annotations.map((ann, i) => (
          <div 
            key={i} 
            className="absolute bg-yellow-200 text-slate-800 text-xs p-2 rounded shadow-md border border-yellow-300 z-20 whitespace-pre-wrap max-w-xs"
            style={{ left: ann.x, top: ann.y }}
            title="Double click to remove"
            onDoubleClick={() => setAnnotations(annotations.filter((_, idx) => idx !== i))}
          >
            {ann.text}
          </div>
        ))}
      </div>
    </div>
  );
};
