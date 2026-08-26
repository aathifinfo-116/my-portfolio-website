import { ResourceManager } from '../components/ResourceManager';
import {
  FileField,
  NumberField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../forms/Fields';
import { DynamicIcon } from '@/components/ui/Primitives';
import type { Award } from '@/types/api';

interface AwardForm {
  title: string;
  issuer: string;
  year: number;
  description: string;
  iconName: string;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
}

const optional = (value: string) => (value.trim() ? value.trim() : undefined);

export function AwardsPage() {
  return (
    <ResourceManager<Award, AwardForm>
      config={{
        endpoint: '/awards',
        listEndpoint: '/awards/admin/all',
        title: 'Award',
        description: 'Honours shown in the Awards & Recognition section.',
        keyOf: (item) => item.id,
        labelOf: (item) => item.title,
        emptyForm: {
          title: '',
          issuer: '',
          year: new Date().getFullYear(),
          description: '',
          iconName: 'Trophy',
          imageUrl: null,
          isPublished: true,
          sortOrder: 0,
        },
        toForm: (item) => ({
          title: item.title,
          issuer: item.issuer,
          year: item.year ?? new Date().getFullYear(),
          description: item.description ?? '',
          iconName: item.iconName,
          imageUrl: item.imageUrl,
          isPublished: item.isPublished,
          sortOrder: item.sortOrder,
        }),
        toPayload: (form) => ({
          title: form.title,
          issuer: form.issuer,
          year: form.year,
          description: optional(form.description),
          iconName: form.iconName,
          imageUrl: form.imageUrl ?? undefined,
          isPublished: form.isPublished,
          sortOrder: form.sortOrder,
        }),
        renderRow: (item) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <DynamicIcon name={item.iconName} className="h-4 w-4 text-amber-300" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-200">
                {item.title}
                {!item.isPublished && (
                  <span className="ml-2 rounded border border-amber-400/30 px-1.5 py-0.5 text-[0.6rem] text-amber-300">
                    Draft
                  </span>
                )}
              </p>
              <p className="truncate text-[0.72rem] text-slate-500">
                {item.issuer}
                {item.year ? ` · ${item.year}` : ''}
              </p>
            </div>
          </div>
        ),
        renderForm: (form, set) => (
          <>
            <TextField
              label="Title"
              value={form.title}
              onChange={(v) => set('title', v)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Issuer"
                value={form.issuer}
                onChange={(v) => set('issuer', v)}
                required
              />
              <NumberField
                label="Year"
                value={form.year}
                onChange={(v) => set('year', v)}
              />
            </div>
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => set('description', v)}
              rows={3}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Icon name"
                value={form.iconName}
                onChange={(v) => set('iconName', v)}
                hint="Trophy / Star / Medal"
              />
              <NumberField
                label="Sort order"
                value={form.sortOrder}
                onChange={(v) => set('sortOrder', v)}
              />
            </div>
            <FileField
              label="Award image / badge"
              value={form.imageUrl}
              onChange={(url) => set('imageUrl', url)}
              endpoint="/uploads/award-image"
              accept="image/*"
            />
            <ToggleField
              label="Published"
              value={form.isPublished}
              onChange={(v) => set('isPublished', v)}
            />
          </>
        ),
      }}
    />
  );
}
