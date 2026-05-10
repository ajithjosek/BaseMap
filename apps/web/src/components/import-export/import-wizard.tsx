'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';

interface ImportWizardProps {
  modelType: 'application' | 'cost';
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportWizard({ modelType, onClose, onSuccess }: ImportWizardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'processing' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<{ successRows: number; failedRows: number } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setValidationErrors([{ row: 0, errors: [{ field: 'file', message: 'Invalid file type. Please upload CSV or Excel files only.' }] }]);
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setPreviewData([]);
    setImportJobId(null);
    setImportStatus('idle');
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setImportJobId(null);
    setImportStatus('idle');
    setResult(null);
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsProcessing(true);
    setImportStatus('validating');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelType', modelType);
      formData.append('fileType', file.name.endsWith('.csv') ? 'csv' : 'xlsx');

      const response = await api.post('/import-export/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const job = response.data;
      setImportJobId(job.id);

      if (job.preview_data && Array.isArray(job.preview_data)) {
        setPreviewData(job.preview_data);
      }

      if (job.errors && job.errors.length > 0) {
        setValidationErrors(job.errors);
        setImportStatus('failed');
      } else {
        setImportStatus('validating');
      }
    } catch (error) {
      console.error('Preview failed:', error);
      setValidationErrors([{ row: 0, errors: [{ field: 'file', message: 'Failed to preview file. Please try again.' }] }]);
      setImportStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importJobId) return;

    setIsProcessing(true);
    setImportStatus('processing');

    try {
      const response = await api.post(`/import-export/import/${importJobId}/process`);

      if (response.data.success) {
        setImportStatus('completed');
        setResult({
          successRows: response.data.successRows,
          failedRows: response.data.failedRows,
        });
        onSuccess();
      } else {
        setImportStatus('failed');
        setValidationErrors([{ row: 0, errors: [{ field: 'import', message: 'Import processing failed.' }] }]);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('failed');
      setValidationErrors([{ row: 0, errors: [{ field: 'import', message: 'Import processing failed. Please try again.' }] }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileType = () => {
    if (!file) return '';
    return file.name.endsWith('.csv') ? 'csv' : 'xlsx';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Import {modelType === 'application' ? 'Applications' : 'Costs'}</h1>
        <Button variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>

      {!file ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Drag and drop your CSV or Excel file here, or click to select</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">CSV or Excel files up to 10MB</p>
              <Input
                id="file-input"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>File Selected</CardTitle>
            <CardDescription>{file.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {importStatus === 'completed' && result ? (
              <div className="space-y-4">
                <Progress value={100} className="w-full" />
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Import completed successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Successful Rows</p>
                    <p className="text-2xl font-bold text-green-700">{result.successRows}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${result.failedRows > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`text-sm ${result.failedRows > 0 ? 'text-red-600' : 'text-green-600'}`}>Failed Rows</p>
                    <p className={`text-2xl font-bold ${result.failedRows > 0 ? 'text-red-700' : 'text-green-700'}`}>{result.failedRows}</p>
                  </div>
                </div>
              </div>
            ) : importStatus === 'processing' ? (
              <div className="space-y-4">
                <Progress value={50} className="w-full" />
                <div className="flex items-center gap-2 text-blue-600">
                  <Upload className="h-5 w-5 animate-pulse" />
                  <span>Processing import...</span>
                </div>
              </div>
            ) : (
              <>
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        {validationErrors.map((err, idx) => (
                          <li key={idx}>
                            {err.row ? `Row ${err.row}: ` : ''}
                            {err.errors?.map((e: any, i: number) => e.message).join(', ')}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {previewData.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Preview Data</h3>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th key={key} className="p-2 text-left font-medium capitalize">{key.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-t">
                              {Object.values(row).map((val: any, i: number) => (
                                <td key={i} className="p-2">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  {!importJobId ? (
                    <Button onClick={handlePreview} disabled={isProcessing}>
                      {isProcessing ? 'Validating...' : 'Preview'}
                    </Button>
                  ) : (
                    <Button onClick={handleImport} disabled={isProcessing || validationErrors.length > 0}>
                      {isProcessing ? 'Processing...' : 'Start Import'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
