'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CapabilityFormValues {
  name: string;
  level: number;
  description?: string;
  strategic_importance?: string;
  parent_id?: string;
}

interface CapabilityDraft {
  name: string;
  level: string | number;
  description?: string;
  strategic_importance?: string;
  parent_id?: string;
}

export const CAPABILITY_LEVELS = [1, 2, 3, 4] as const;
export const STRATEGIC_IMPORTANCE = ['Low', 'Medium', 'High', 'Critical'] as const;

// Radix Select forbids an empty string value, so "unset" needs a sentinel.
const NONE = 'none';

/**
 * Shapes the dialog's raw field values into the payload `POST /capabilities`
 * expects: the Select hands back a string for `level` while the DTO requires an
 * integer, and blank optional fields must be left out entirely.
 */
export function buildCapabilityPayload(draft: CapabilityDraft): CapabilityFormValues {
  const payload: CapabilityFormValues = {
    name: draft.name.trim(),
    level: Number(draft.level),
  };

  const description = draft.description?.trim();
  if (description) payload.description = description;

  if (draft.strategic_importance && draft.strategic_importance !== NONE) {
    payload.strategic_importance = draft.strategic_importance;
  }

  const parentId = draft.parent_id?.trim();
  if (parentId && parentId !== NONE) payload.parent_id = parentId;

  return payload;
}

interface CreateCapabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CapabilityFormValues) => void;
  isPending?: boolean;
  /** Capabilities that can be chosen as the parent, flattened by the page. */
  parentOptions?: { id: string; name: string }[];
  defaultParentId?: string | null;
}

export function CreateCapabilityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  parentOptions = [],
  defaultParentId,
}: CreateCapabilityDialogProps) {
  const t = useTranslations('capabilities');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<string>(String(CAPABILITY_LEVELS[0]));
  const [parentId, setParentId] = useState<string>(NONE);
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<string>(NONE);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setImportance(NONE);
    setLevel(String(CAPABILITY_LEVELS[0]));
    setParentId(defaultParentId ?? NONE);
  }, [open, defaultParentId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(
      buildCapabilityPayload({
        name,
        level,
        description,
        strategic_importance: importance,
        parent_id: parentId,
      }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('create_dialog_title')}</DialogTitle>
            <DialogDescription>{t('create_dialog_desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="capability-name">{t('name')}</Label>
              <Input
                id="capability-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name_ph')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capability-level">{t('level')}</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="capability-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPABILITY_LEVELS.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {t('level_option', { level: value })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capability-parent">{t('parent')}</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="capability-parent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('parent_none')}</SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capability-importance">{t('strategic_importance')}</Label>
              <Select value={importance} onValueChange={setImportance}>
                <SelectTrigger id="capability-importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('importance_none')}</SelectItem>
                  {STRATEGIC_IMPORTANCE.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`importance_${value.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capability-description">{t('description')}</Label>
              <Textarea
                id="capability-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description_ph')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
