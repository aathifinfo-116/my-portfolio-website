import { ResourceManager } from '../components/ResourceManager';
import {
  FileField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../forms/Fields';
import {
  CERTIFICATION_CATEGORIES,
  type Certification,
  type CertificationCategory,
} from '@/types/api';

interface CertificationForm {
  title: string;
  institution: string;
  category: CertificationCategory;
  description: string;
  issuedOn: string;
  issuedYear: number;
  credentialUrl: string;
  badgeUrl: string | null;
  documentUrl: string | null;
  documentName: string;
  isVerified: boolean;
  isPublished: boolean;
  sortOrder: number;
}

const optional = (value: string) => (value.trim() ? value.trim() : undefined);

export function CertificationsPage() {
  return (
    <ResourceManager<Certification, CertificationForm>
      config={{
        endpoint: '/certifications',
        listEndpoint: '/certifications/admin/all',
        title: 'Certification',
        description: 'Degrees, professional history and certifications.',
        keyOf: (item) => item.id,
        labelOf: (item) => item.title,
        emptyForm: {
          title: '',
          institution: '',
          category: 'Certification',
          description: '',
          issuedOn: '',
          issuedYear: new Date().getFullYear(),
          credentialUrl: '',
          badgeUrl: null,
          documentUrl: null,
          documentName: '',
          isVerified: false,
          isPublished: true,
          sortOrder: 0,
        },
        toForm: (item) => ({
          title: item.title,
          institution: item.institution,
          category: item.category,
          description: item.description ?? '',
          issuedOn: item.issuedOn ?? '',
          issuedYear: item.issuedYear ?? new Date().getFullYear(),
          credentialUrl: item.credentialUrl ?? '',
          badgeUrl: item.badgeUrl,
          documentUrl: item.documentUrl,
          documentName: item.documentName ?? '',
          isVerified: item.isVerified,
          isPublished: item.isPublished,
          sortOrder: item.sortOrder,
        }),
        toPayload: (form) => ({
          title: form.title,
          institution: form.institution,
          category: form.category,
          description: optional(form.description),
          issuedOn: optional(form.issuedOn),
          issuedYear: form.issuedYear,
          credentialUrl: optional(form.credentialUrl),
          badgeUrl: form.badgeUrl ?? undefined,
          documentUrl: form.documentUrl ?? undefined,
          documentName: optional(form.documentName),
          isVerified: form.isVerified,
          isPublished: form.isPublished,
          sortOrder: form.sortOrder,
        }),
        renderRow: (item) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-200">
              {item.title}
              {item.isVerified && (
                <span className="ml-2 rounded border border-emerald-400/30 px-1.5 py-0.5 text-[0.6rem] text-emerald-300">
                  Verified
                </span>
              )}
              {!item.isPublished && (
                <span className="ml-2 rounded border border-amber-400/30 px-1.5 py-0.5 text-[0.6rem] text-amber-300">
                  Draft
                </span>
              )}
            </p>
            <p className="truncate text-[0.72rem] text-slate-500">
              {item.category} · {item.institution}
              {item.issuedOn ? ` · ${item.issuedOn}` : ''}
            </p>
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
            <TextField
              label="Institution"
              value={form.institution}
              onChange={(v) => set('institution', v)}
              required
            />
            <SelectField
              label="Category"
              value={form.category}
              options={CERTIFICATION_CATEGORIES}
              onChange={(v) => set('category', v)}
              required
            />
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => set('description', v)}
              rows={3}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Issued on"
                value={form.issuedOn}
                onChange={(v) => set('issuedOn', v)}
                hint="e.g. 2019 - 2023"
              />
              <NumberField
                label="Issued year"
                value={form.issuedYear}
                onChange={(v) => set('issuedYear', v)}
                hint="sorting key"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FileField
                label="Badge / logo"
                value={form.badgeUrl}
                onChange={(url) => set('badgeUrl', url)}
                endpoint="/uploads/badge"
                accept="image/*"
              />
              <FileField
                label="Certificate PDF"
                value={form.documentUrl}
                onChange={(url, meta) => {
                  set('documentUrl', url);
                  if (meta) set('documentName', meta.fileName);
                }}
                endpoint="/uploads/document"
                accept="application/pdf"
              />
            </div>

            <TextField
              label="Credential URL"
              value={form.credentialUrl}
              onChange={(v) => set('credentialUrl', v)}
              hint="external verification page"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Sort order"
                value={form.sortOrder}
                onChange={(v) => set('sortOrder', v)}
              />
              <div className="space-y-3">
                <ToggleField
                  label="Verified"
                  value={form.isVerified}
                  onChange={(v) => set('isVerified', v)}
                />
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
