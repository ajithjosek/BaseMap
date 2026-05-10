'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Columns,
  MoreHorizontal,
  Download,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('name:asc');
  const [filters, setFilters] = useState<any>({
    lifecycle: [],
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'select', 'name', 'lifecycle', 'businessUnit', 'vendor', 'techType', 'actions'
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', page, search, sort, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        sort,
      });
      
      if (filters.lifecycle.length > 0) {
        filters.lifecycle.forEach((l: string) => params.append('lifecycle', l));
      }

      const response = await api.get(`/applications?${params.toString()}`);
      return response.data;
    },
  });

  const getLifecycleVariant = (state: string) => {
    switch (state) {
      case 'Active': return 'success';
      case 'Planning': return 'info';
      case 'Maintenance': return 'warning';
      case 'Retirement':
      case 'Retired': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleSort = (field: string) => {
    const [currentField, currentOrder] = sort.split(':');
    if (currentField === field) {
      setSort(`${field}:${currentOrder === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSort(`${field}:asc`);
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data?.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data?.data.map((app: any) => app.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.post('/applications/bulk-delete', { ids });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedIds([]);
    },
  });

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} applications?`)) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const exportToCsv = () => {
    // Basic CSV export logic
    const headers = ['Name', 'Lifecycle', 'Business Unit', 'Vendor', 'Technology Type'];
    const rows = data?.data.map((app: any) => [
      app.name,
      app.lifecycle_state,
      app.business_unit?.name || '',
      app.vendor || '',
      app.technology_type || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((e: any) => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "applications.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="mr-2 h-4 w-4" /> Add Application
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applications..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <Filter className="mr-2 h-4 w-4" /> Filters
                {filters.lifecycle.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.lifecycle.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Lifecycle State</h4>
                <div className="space-y-2">
                  {['Planning', 'Active', 'Maintenance', 'Retirement', 'Retired'].map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-${state}`}
                        checked={filters.lifecycle.includes(state)}
                        onCheckedChange={(checked) => {
                          setFilters((prev: any) => ({
                            ...prev,
                            lifecycle: checked 
                              ? [...prev.lifecycle, state]
                              : prev.lifecycle.filter((l: string) => l !== state)
                          }));
                        }}
                      />
                      <label htmlFor={`filter-${state}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {state}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <Columns className="mr-2 h-4 w-4" /> Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none mb-4">Visible Columns</h4>
                {[
                  { id: 'name', label: 'Name' },
                  { id: 'lifecycle', label: 'Lifecycle' },
                  { id: 'businessUnit', label: 'Business Unit' },
                  { id: 'vendor', label: 'Vendor' },
                  { id: 'techType', label: 'Tech Type' },
                ].map((col) => (
                  <div key={col.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`col-${col.id}`}
                      checked={visibleColumns.includes(col.id)}
                      onCheckedChange={() => toggleColumn(col.id)}
                    />
                    <label htmlFor={`col-${col.id}`} className="text-sm font-medium leading-none">
                      {col.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{selectedIds.length} selected</span>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> {deleteMutation.isPending ? 'Deleting...' : 'Bulk Delete'}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.includes('select') && (
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedIds.length > 0 && selectedIds.length === data?.data.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {visibleColumns.includes('name') && (
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center">
                    Name <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {visibleColumns.includes('lifecycle') && (
                <TableHead onClick={() => handleSort('lifecycle_state')} className="cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center">
                    Lifecycle <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {visibleColumns.includes('businessUnit') && (
                <TableHead>Business Unit</TableHead>
              )}
              {visibleColumns.includes('vendor') && (
                <TableHead>Vendor</TableHead>
              )}
              {visibleColumns.includes('techType') && (
                <TableHead>Technology Type</TableHead>
              )}
              {visibleColumns.includes('actions') && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((app: any) => (
                <TableRow key={app.id} data-state={selectedIds.includes(app.id) ? 'selected' : ''}>
                  {visibleColumns.includes('select') && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(app.id)}
                        onCheckedChange={() => toggleSelect(app.id)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.includes('name') && (
                    <TableCell className="font-medium">
                      <Link href={`/applications/${app.id}`} className="hover:underline text-blue-600">
                        {app.name}
                      </Link>
                    </TableCell>
                  )}
                  {visibleColumns.includes('lifecycle') && (
                    <TableCell>
                      <Badge variant={getLifecycleVariant(app.lifecycle_state)}>
                        {app.lifecycle_state}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.includes('businessUnit') && (
                    <TableCell>{app.business_unit?.name || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('vendor') && (
                    <TableCell>{app.vendor || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('techType') && (
                    <TableCell>{app.technology_type || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('actions') && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/applications/${app.id}/edit`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="text-sm font-medium">
          Page {page} of {data?.meta.totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= (data?.meta.totalPages || 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
