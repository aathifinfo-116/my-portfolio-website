import { useRef, useState, type ReactNode } from 'react';
import { Loader2, Paperclip, UploadCloud, X } from 'lucide-react';
import { apiClient, extractErrorMessage, resolveFileUrl } from '@/lib/apiClient';
import { cn } from '@/components/ui/Primitives';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm ' +
  'text-slate-200 placeholder:text-slate-600 outline-none transition-colors ' +
  'focus:border-violet-accent/60';

export function FieldShell({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="text-rose-400">*</span>}
        {hint && (
          <span className="ml-auto normal-case tracking-normal text-slate-600">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <FieldShell label={label} required={required} hint={hint}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </FieldShell>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} required={required}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'resize-y')}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} required={required}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(inputClass, 'cursor-pointer')}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-ink-900">
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function ToggleField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:border-violet-accent/40"
    >
      <span>
        <span className="block text-[0.8rem] font-semibold text-slate-200">
          {label}
        </span>
        {description && (
          <span className="block text-[0.68rem] text-slate-500">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          value ? 'gradient-surface' : 'bg-white/12',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}

/** Comma-or-Enter separated list, stored as string[]. */
export function TagsField({
  label,
  value,
  onChange,
  placeholder = 'Type and press Enter',
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft('');
  };

  return (
    <FieldShell label={label} hint={`${value.length} tag(s)`}>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
        {value.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-violet-accent/25 bg-violet-accent/10 px-2.5 py-1 text-[0.7rem] text-violet-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((t) => t !== tag))}
                  aria-label={`Remove ${tag}`}
                  className="text-violet-300/60 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          className="w-full bg-transparent px-1.5 py-1 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
        />
      </div>
    </FieldShell>
  );
}

/**
 * Uploads immediately on selection and hands the resulting public URL back.
 *
 * Uploading up-front (rather than on form submit) keeps the entity payload a
 * plain JSON body and lets the same endpoints serve create and edit.
 */
export function FileField({
  label,
  value,
  onChange,
  endpoint,
  accept,
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null, meta?: { fileName: string }) => void;
  /** Upload route, e.g. "/uploads/avatar" or "/uploads/document/devops". */
  endpoint: string;
  accept: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await apiClient.post<{
        url: string;
        originalName: string;
        storedName: string;
      }>(endpoint, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url, { fileName: data.storedName });
    } catch (err) {
      setError(extractErrorMessage(err, 'Upload failed.'));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const preview = resolveFileUrl(value);
  const isImage = accept.includes('image');

  return (
    <FieldShell label={label} hint={hint}>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        {value ? (
          <div className="mb-3 flex items-center gap-3">
            {isImage && preview ? (
              <img
                src={preview}
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06]">
                <Paperclip className="h-4 w-4 text-violet-accent" />
              </span>
            )}
            <a
              href={preview ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-[0.72rem] text-violet-300 hover:text-white"
            >
              {decodeURIComponent(value.split('/').pop() ?? value)}
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove file"
              className="text-slate-500 hover:text-rose-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-[0.75rem] font-semibold text-slate-300 transition-colors hover:border-violet-accent/50 hover:text-white disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud className="h-3.5 w-3.5" />
              {value ? 'Replace file' : 'Choose file'}
            </>
          )}
        </button>

        {error && <p className="mt-2 text-[0.7rem] text-rose-400">{error}</p>}
      </div>
    </FieldShell>
  );
}
