'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, ArrowRight, Check, X } from 'lucide-react';

interface ColumnMappingProps {
  fileColumns: string[];
  targetColumns: { key: string; label: string; required?: boolean }[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const APPLICATION_COLUMNS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'version', label: 'Version' },
  { key: 'lifecycle_state', label: 'Lifecycle State', required: true },
  { key: 'risk_score', label: 'Risk Score' },
  { key: 'eol_date', label: 'EOL Date' },
  { key: 'deployment_model', label: 'Deployment Model' },
  { key: 'cloud_provider', label: 'Cloud Provider' },
  { key: 'business_unit', label: 'Business Unit' },
  { key: 'owner', label: 'Owner' },
  { key: 'technology_type', label: 'Technology Type' },
  { key: 'data_classification', label: 'Data Classification' },
  { key: 'processes_pii', label: 'Processes PII' },
  { key: 'processes_phi', label: 'Processes PHI' },
  { key: 'is_shadow_it', label: 'Is Shadow IT' },
];

export function ColumnMapping({ fileColumns, targetColumns, onMappingComplete, onCancel }: ColumnMappingProps) {
  const columns = targetColumns.length > 0 ? targetColumns : APPLICATION_COLUMNS;
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const mappedFileColumns = Object.values(mapping);
  const unmappedRequired = columns.filter(
    (col) => col.required && !Object.keys(mapping).some((key) => mapping[key] === col.key)
  );

  const handleMap = (targetKey: string, fileColumn: string) => {
    setMapping((prev) => {
      const newMapping = { ...prev };
      if (fileColumn === 'skip') {
        delete newMapping[targetKey];
      } else {
        Object.keys(newMapping).forEach((key) => {
          if (newMapping[key] === fileColumn) delete newMapping[key];
        });
        newMapping[fileColumn] = targetKey;
      }
      return newMapping;
    });
  };

  const getTargetForFileColumn = (fileColumn: string) => {
    return Object.entries(mapping).find(([_, target]) => target === fileColumn)?.[0];
  };

  const handleComplete = () => {
    const cleanMapping: Record<string, string> = {};
    Object.entries(mapping).forEach(([fileCol, targetKey]) => {
      cleanMapping[targetKey] = fileCol;
    });
    onMappingComplete(cleanMapping);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mapping</CardTitle>
        <CardDescription>Map columns from your file to BaseMap fields</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-500 pb-2 border-b">
          <div>File Column</div>
          <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4" /></div>
          <div>BaseMap Field</div>
        </div>

        {fileColumns.map((fileCol) => {
          const currentTarget = getTargetForFileColumn(fileCol);
          return (
            <div key={fileCol} className="grid grid-cols-3 gap-4 items-center py-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{fileCol}</span>
              </div>
              <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4 text-slate-400" /></div>
              <div>
                <Select
                  value={currentTarget || ''}
                  onValueChange={(value) => handleMap(value, fileCol)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">-- Skip --</SelectItem>
                    {columns
                      .filter((col) => !currentTarget || currentTarget === col.key || !Object.values(mapping).includes(col.key))
                      .map((col) => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.label} {col.required && <Badge variant="destructive" className="ml-1 text-[10px]">Required</Badge>}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}

        {unmappedRequired.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium">Required fields not mapped:</p>
            <ul className="text-sm text-red-500 mt-1">
              {unmappedRequired.map((col) => (
                <li key={col.key}>{col.label}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleComplete} disabled={unmappedRequired.length > 0}>
            <Check className="mr-2 h-4 w-4" /> Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
