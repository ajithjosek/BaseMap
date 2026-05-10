// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ExecutiveWidgets } from './executive-widgets';
import { FinancialWidgets } from './financial-widgets';
import { RiskWidgets } from './risk-widgets';
import { Button } from '@/components/ui/button';
import { Download, LayoutDashboard } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function DashboardGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: executiveData } = useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async () => (await api.get('/dashboards/executive')).data,
    enabled: mounted,
  });

  const { data: financialData } = useQuery({
    queryKey: ['dashboard-financial'],
    queryFn: async () => (await api.get('/dashboards/financial')).data,
    enabled: mounted,
  });

  const { data: riskData } = useQuery({
    queryKey: ['dashboard-risk'],
    queryFn: async () => (await api.get('/dashboards/risk')).data,
    enabled: mounted,
  });

  const exportPdf = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('dashboard.pdf');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8" /> Executive Dashboard
        </h1>
        <Button onClick={exportPdf} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div ref={containerRef} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        {/* Executive Row */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <ExecutiveWidgets data={executiveData} />
        </div>
        
        {/* Financial and Risk Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm">
            <FinancialWidgets data={financialData} />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <RiskWidgets data={riskData} />
          </div>
        </div>
      </div>
    </div>
  );
}
