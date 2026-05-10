'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet, FileText, FileJson, Filter, Calendar, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const APPLICATION_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'version', label: 'Version' },
  { key: 'technology_type', label: 'Technology Type' },
  { key: 'lifecycle_state', label: 'Lifecycle State' },
  { key: 'risk_score', label: 'Risk Score' },
  { key: 'eol_date', label: 'EOL Date' },
  { key: 'deployment_model', label: 'Deployment Model' },
  { key: 'cloud_provider', label: 'Cloud Provider' },
  { key: 'data_classification', label: 'Data Classification' },
  { key: 'processes_pii', label: 'Processes PII' },
  { key: 'is_shadow_it', label: 'Is Shadow IT' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
];

const COST_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'application_name', label: 'Application' },
  { key: 'cost_type', label: 'Cost Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'currency', label: 'Currency' },
  { key: 'billing_cycle', label: 'Billing Cycle' },
  { key: 'total_seats', label: 'Total Seats' },
  { key: 'used_seats', label: 'Used Seats' },
  { key: 'effective_date', label: 'Effective Date' },
  { key: 'end_date', label: 'End Date' },
];

interface ExportUIProps {
  exportType?: 'applications' | 'costs';
  onClose?: () => void;
}

export function ExportUI({ exportType = 'applications', onClose }: ExportUIProps) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    (exportType === 'applications' ? APPLICATION_COLUMNS : COST_COLUMNS).map(c => c.key)
  );
  const [filters, setFilters] = useState({
    lifecycle: '',
    search: '',
    business_unit: '',
  });
  const [scheduledExport, setScheduledExport] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const queryClient = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/import-export/export', {
        exportType,
        format: selectedFormat,
        filters: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        columns: selectedColumns,
      });
      const job = response.data;
      await api.post(`/import-export/export/${job.id}/process`);
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const columns = exportType === 'applications' ? APPLICATION_COLUMNS : COST_COLUMNS;

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileText className="h-4 w-4" />;
      case 'xlsx': return <FileSpreadsheet className="h-4 w-4" />;
      case 'json': return <FileJson className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Export {exportType === 'applications' ? 'Applications' : 'Costs'}</CardTitle>
            <CardDescription>Configure your export settings</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="flex gap-2">
            {['csv', 'xlsx', 'json'].map((format) => (
              <Button
                key={format}
                variant={selectedFormat === format ? 'default' : 'outline'}
                onClick={() => setSelectedFormat(format)}
                className="flex items-center gap-2"
              >
                {getFormatIcon(format)}
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-500">Lifecycle State</Label>
              <Select value={filters.lifecycle} onValueChange={(v) => setFilters({ ...filters, lifecycle: v })}>
                <SelectTrigger><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All states</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-500">Search</Label>
              <Input
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Columns ({selectedColumns.length} selected)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center gap-2">
                <Checkbox
                  id={`col-${col.key}`}
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                />
                <label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">
                  {col.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="scheduled"
              checked={scheduledExport}
              onCheckedChange={(checked) => setScheduledExport(checked as boolean)}
            />
            <Label htmlFor="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Schedule Export
            </Label>
          </div>
          {scheduledExport && (
            <Input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending || selectedColumns.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {scheduledExport ? 'Schedule' : 'Export'} {exportMutation.isPending ? '...' : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
