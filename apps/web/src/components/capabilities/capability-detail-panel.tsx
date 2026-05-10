'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface CapabilityDetailPanelProps {
  capability: any;
  onSave: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CapabilityDetailPanel({ capability, onSave, onDelete }: CapabilityDetailPanelProps) {
  const [formData, setFormData] = useState(capability);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(capability);
  }, [capability]);

  if (!capability) {
    return (
      <Card className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <p>Select a capability from the tree</p>
          <p className="text-sm">to view or edit its details</p>
        </div>
      </Card>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(capability.id, formData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const isLocked = formData?.is_locked;

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
        <div>
          <CardTitle>{capability.name}</CardTitle>
          <CardDescription>Level {capability.level} Capability</CardDescription>
        </div>
        <div className="flex gap-2">
          {isLocked ? <Lock size={16} className="text-amber-500 mt-1" /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            value={formData?.name || ''} 
            onChange={(e) => setFormData({ ...(formData || capability), name: e.target.value })}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={formData?.description || ''} 
            onChange={(e) => setFormData({ ...(formData || capability), description: e.target.value })}
            disabled={isLocked}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Strategic Importance</Label>
            <Select 
              value={formData?.strategic_importance || 'Medium'} 
              onValueChange={(val) => setFormData({ ...(formData || capability), strategic_importance: val })}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select importance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Owner ID</Label>
            <Input 
              id="owner_id" 
              value={formData?.owner_id || ''} 
              onChange={(e) => setFormData({ ...(formData || capability), owner_id: e.target.value })}
              disabled={isLocked}
              placeholder="e.g. user uuid"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4 border-t">
          <Switch 
            id="lock-toggle" 
            checked={formData?.is_locked || false}
            onCheckedChange={(val) => setFormData({ ...(formData || capability), is_locked: val })}
          />
          <Label htmlFor="lock-toggle" className="cursor-pointer">
            {formData?.is_locked ? "Locked (Immutable)" : "Unlocked (Editable)"}
          </Label>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="destructive" size="sm" onClick={() => onDelete(capability.id)} disabled={isLocked}>
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || (isLocked && formData?.is_locked)}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
