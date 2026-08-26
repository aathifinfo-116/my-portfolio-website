import { ResourceManager } from '../components/ResourceManager';
import {
  FileField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../forms/Fields';
import { formatFileSize, formatUploadDate } from '@/lib/formatters';
import {
  DOCUMENT_DOMAINS,
  type DocumentDomain,
  type StudyDocument,
} from '@/types/api';

interface DocumentForm {
  title: string;
  topic: string;
  domain: DocumentDomain;
  description: string;
  fileUrl: string | null;
  fileName: string;
  isPublished: boolean;
  sortOrder: number;
}

const optional = (value: string) => (value.trim() ? value.trim() : undefined);

export function DocumentsPage() {
  return (
    <ResourceManager<StudyDocument, DocumentForm>
      config={{
        endpoint: '/documents',
        listEndpoint: '/documents/admin/all',
        title: 'Document',
        description:
          'Study materials. File type, size and upload date are derived from the file itself.',
        keyOf: (item) => item.id,
        labelOf: (item) => item.title,
        emptyForm: {
          title: '',
          topic: '',
          domain: 'Development',
          description: '',
          fileUrl: null,
          fileName: '',
          isPublished: true,
          sortOrder: 0,
        },
        toForm: (item) => ({
          title: item.title,
          topic: item.topic ?? '',
          domain: item.domain,
          description: item.description ?? '',
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          isPublished: item.isPublished,
          sortOrder: item.sortOrder,
        }),
        toPayload: (form) => ({
          title: form.title,
          topic: optional(form.topic),
          domain: form.domain,
          description: optional(form.description),
          fileUrl: form.fileUrl ?? undefined,
          fileName: optional(form.fileName),
          isPublished: form.isPublished,
          sortOrder: form.sortOrder,
        }),
        renderRow: (item) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-200">
              {item.title}
              <span className="ml-2 rounded border border-violet-accent/30 px-1.5 py-0.5 text-[0.6rem] uppercase text-violet-300">
                {item.fileType}
              </span>
              {!item.isPublished && (
                <span className="ml-2 rounded border border-amber-400/30 px-1.5 py-0.5 text-[0.6rem] text-amber-300">
                  Draft
                </span>
              )}
            </p>
            <p className="truncate text-[0.72rem] text-slate-500">
              {item.domain} · {formatFileSize(item.fileSizeBytes)} ·{' '}
              {formatUploadDate(item.uploadedAt)} · {item.downloadCount} download
              {item.downloadCount === 1 ? '' : 's'}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Domain"
                value={form.domain}
                options={DOCUMENT_DOMAINS}
                onChange={(v) => set('domain', v)}
                required
              />
              <TextField
                label="Topic"
                value={form.topic}
                onChange={(v) => set('topic', v)}
                hint="e.g. Kubernetes"
              />
            </div>

            {/*
              The upload endpoint carries the domain, so the file lands in
              uploads/documents/{domain}. Changing the domain before uploading
              changes where the file is written.
            */}
            <FileField
              label="Document file"
              value={form.fileUrl}
              onChange={(url, meta) => {
                set('fileUrl', url);
                if (meta) set('fileName', meta.fileName);
              }}
              endpoint={`/uploads/document/${form.domain}`}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              hint={`documents/${form.domain.toLowerCase()}`}
            />

            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => set('description', v)}
              rows={3}
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
