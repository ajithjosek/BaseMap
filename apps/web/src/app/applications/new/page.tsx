'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  vendor: z.string().optional(),
  version: z.string().optional(),
  technology_type: z.string().optional(),
  lifecycle_state: z.enum(['Planning', 'Active', 'Maintenance', 'Retirement', 'Retired']),
  deployment_model: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function NewApplicationPage() {
  const t = useTranslations('newApplication');
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      lifecycle_state: 'Planning',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ApplicationFormValues) => {
      const response = await api.post('/applications', values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      router.push('/applications');
    },
  });

  const onSubmit = (values: ApplicationFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('details_title')}</CardTitle>
          <CardDescription>
            {t('details_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('application_name')}</Label>
              <Input id="name" {...register('name')} placeholder={t('name_ph')} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder={t('description_ph')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">{t('vendor')}</Label>
                <Input id="vendor" {...register('vendor')} placeholder={t('vendor_ph')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">{t('version')}</Label>
                <Input id="version" {...register('version')} placeholder={t('version_ph')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technology_type">{t('technology_type')}</Label>
                <Input id="technology_type" {...register('technology_type')} placeholder={t('technology_ph')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle_state">{t('lifecycle_state')}</Label>
                <Select
                  onValueChange={(value) => setValue('lifecycle_state', value as any)}
                  defaultValue="Planning"
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_state')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">{t('state_planning')}</SelectItem>
                    <SelectItem value="Active">{t('state_active')}</SelectItem>
                    <SelectItem value="Maintenance">{t('state_maintenance')}</SelectItem>
                    <SelectItem value="Retirement">{t('state_retirement')}</SelectItem>
                    <SelectItem value="Retired">{t('state_retired')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deployment_model">{t('deployment_model')}</Label>
              <Input
                id="deployment_model"
                {...register('deployment_model')}
                placeholder={t('deployment_ph')}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={mutation.isPending}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('creating') : t('create_application')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
