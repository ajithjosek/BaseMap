'use client';

import React, { useState } from 'react';
import { CustomTreemap, CustomSankey, CustomGantt, ChartAnnotationWrapper } from '@/components/charts/AdvancedCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Presentation } from 'lucide-react';

// Mock Data for Stories
const treemapData = [
  { name: 'HR', size: 400 },
  { name: 'Finance', size: 300 },
  { name: 'IT', size: 300 },
  { name: 'Sales', size: 200 },
];

const sankeyData = {
  nodes: [{ name: 'Data Center' }, { name: 'AWS' }, { name: 'Azure' }, { name: 'Application A' }, { name: 'Application B' }],
  links: [
    { source: 0, target: 3, value: 10 },
    { source: 1, target: 3, value: 5 },
    { source: 2, target: 4, value: 15 },
  ]
};

const ganttData = [
  { id: '1', name: 'Cloud Migration Phase 1', start: new Date('2026-06-01'), end: new Date('2026-08-15'), color: 'bg-indigo-500' },
  { id: '2', name: 'Legacy Decommissioning', start: new Date('2026-08-01'), end: new Date('2026-12-31'), color: 'bg-rose-500' },
  { id: '3', name: 'ERP Implementation', start: new Date('2026-01-15'), end: new Date('2026-11-30'), color: 'bg-emerald-500' },
];

const slides = [
  {
    title: 'Business Unit IT Spend Allocation',
    description: 'Current breakdown of total IT spend by business unit.',
    component: <CustomTreemap data={treemapData} />
  },
  {
    title: 'Infrastructure to Application Lineage',
    description: 'Sankey diagram showing application hosting distribution.',
    component: <CustomSankey data={sankeyData} />
  },
  {
    title: 'Strategic Transformation Timeline',
    description: 'Gantt chart of major upcoming strategic initiatives.',
    component: <CustomGantt data={ganttData} />
  }
];

export default function DashboardStoriesPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide(c => (c + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(c => (c - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Presentation className="h-8 w-8" />
            Executive Presentation
          </h2>
          <p className="text-muted-foreground mt-1">Interactive dashboard stories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={prevSlide}><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
          <span className="flex items-center px-4 font-medium">{currentSlide + 1} / {slides.length}</span>
          <Button variant="outline" onClick={nextSlide}>Next <ChevronRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-5xl shadow-xl h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">{slide.title}</CardTitle>
            <CardDescription>{slide.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-6 relative">
            <div className="w-full h-full">
              <ChartAnnotationWrapper>
                {slide.component}
              </ChartAnnotationWrapper>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
