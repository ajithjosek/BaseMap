'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Database, MoreVertical, GripVertical, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';

interface CapabilityNodeProps {
  node: any;
  level: number;
  onSelect?: (node: any) => void;
  selectedId?: string;
}

type Coverage = 'green' | 'yellow' | 'red';

function getCoverage(node: any): Coverage {
  const hasApps = (node._count?.applications || 0) > 0;
  if (!node.children || node.children.length === 0) {
    return hasApps ? 'green' : 'red';
  }

  const childCoverages = node.children.map(getCoverage);
  const allChildrenGreen = childCoverages.every((c: string) => c === 'green');
  const allChildrenRed = childCoverages.every((c: string) => c === 'red');

  if (hasApps && allChildrenGreen) return 'green';
  if (!hasApps && allChildrenRed) return 'red';
  
  return 'yellow';
}

function CapabilityNode({ node, level, onSelect, selectedId }: CapabilityNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `drag-${node.id}`,
    data: { node },
    disabled: node.is_locked
  });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `drop-${node.id}`,
    data: { node }
  });

  const getImportanceVariant = (importance: string) => {
    switch (importance) {
      case 'Critical': return 'destructive';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      default: return 'secondary';
    }
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const coverage = getCoverage(node);
  const coverageColors = {
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  };

  return (
    <div className="select-none" ref={setDroppableRef}>
      <div 
        ref={setDraggableRef}
        style={style}
        className={cn(
          "flex items-center py-2 px-3 hover:bg-slate-100 rounded-lg cursor-pointer group transition-colors",
          level === 0 && "font-bold text-slate-900 border-b border-slate-100 rounded-none mb-1",
          level > 0 && "text-slate-700 ml-4",
          selectedId === node.id && "bg-blue-50 border-blue-200 text-blue-900",
          isOver && "bg-emerald-50 border-2 border-emerald-400",
          isDragging && "opacity-50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect(node);
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <div 
            {...listeners} 
            {...attributes} 
            className="cursor-grab text-slate-300 hover:text-slate-500 mr-1"
            onClick={e => e.stopPropagation()}
          >
            {!node.is_locked && <GripVertical size={14} />}
            {node.is_locked && <Lock size={14} className="text-amber-500" />}
          </div>
          
          <div onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}>
            {hasChildren ? (
              isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
            ) : (
              <div className="w-4" />
            )}
          </div>
          <Database size={16} className={cn(level === 0 ? "text-blue-600" : "text-slate-400")} />
          <span>{node.name}</span>
          <Badge variant="outline" className={cn("ml-2 text-[10px] py-0 h-4", coverageColors[coverage])}>
            {node._count?.applications || 0} Apps
          </Badge>
          {node.strategic_importance && (
            <Badge variant={getImportanceVariant(node.strategic_importance)} className="ml-2 text-[10px] py-0 h-4">
              {node.strategic_importance}
            </Badge>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="border-l border-slate-200 ml-5 mt-1">
          {node.children.map((child: any) => (
            <CapabilityNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CapabilityTreeProps {
  data: any[];
  onSelect?: (node: any) => void;
  selectedId?: string;
  onMoveNode?: (nodeId: string, newParentId: string | null) => void;
}

export function CapabilityTree({ data, onSelect, selectedId, onMoveNode }: CapabilityTreeProps) {
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const draggedNodeId = active.id.toString().replace('drag-', '');
      const droppedOnNodeId = over.id.toString().replace('drop-', '');
      
      if (onMoveNode && draggedNodeId !== droppedOnNodeId) {
        onMoveNode(draggedNodeId, droppedOnNodeId);
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-1">
        {data.map((root) => (
          <CapabilityNode 
            key={root.id} 
            node={root} 
            level={0} 
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
      </div>
    </DndContext>
  );
}
