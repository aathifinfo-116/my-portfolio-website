import { ResourceManager } from '../components/ResourceManager';
import {
  NumberField,
  TagsField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../forms/Fields';
import { DynamicIcon } from '@/components/ui/Primitives';
import type { ServiceOffering } from '@/types/api';

interface ServiceForm {
  title: string;
  description: string;
  iconName: string;
  accentGradient: string;
  techTags: string[];
  sortOrder: number;
  isPublished: boolean;
}

export function ServicesPage() {
  return (
    <ResourceManager<ServiceOffering, ServiceForm>
      config={{
        endpoint: '/services',
        listEndpoint: '/services/admin/all',
        title: 'Service',
        description: 'Cards shown in the "Services I Offer" grid.',
        keyOf: (item) => item.id,
        labelOf: (item) => item.title,
        emptyForm: {
          title: '',
          description: '',
          iconName: 'Sparkles',
          accentGradient: 'from-accent-500 to-violet-accent',
          techTags: [],
          sortOrder: 0,
          isPublished: true,
        },
        toForm: (item) => ({
          title: item.title,
          description: item.description,
          iconName: item.iconName,
          accentGradient: item.accentGradient ?? '',
          techTags: item.techTags,
          sortOrder: item.sortOrder,
          isPublished: item.isPublished,
        }),
        toPayload: (form) => ({
          ...form,
          accentGradient: form.accentGradient || undefined,
        }),
        renderRow: (item) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <DynamicIcon name={item.iconName} className="h-4 w-4 text-violet-accent" />
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
                {item.techTags.join(' · ') || 'No tags'}
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
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => set('description', v)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Icon name"
                value={form.iconName}
                onChange={(v) => set('iconName', v)}
                hint="Lucide name"
              />
              <TextField
                label="Accent gradient"
                value={form.accentGradient}
                onChange={(v) => set('accentGradient', v)}
                hint="Tailwind classes"
              />
            </div>
            <TagsField
              label="Tech tags"
              value={form.techTags}
              onChange={(v) => set('techTags', v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Sort order"
                value={form.sortOrder}
                onChange={(v) => set('sortOrder', v)}
              />
              <div className="flex items-end">
                <ToggleField
                  label="Published"
                  value={form.isPublished}
                  onChange={(v) => set('isPublished', v)}
                />
              </div>
            </div>
          </>
        ),
      }}
    />
  );
}
