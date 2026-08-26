import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/components/ui/Primitives';

export interface ResourceConfig<T, TForm> {
  /** Base path, e.g. "/projects". */
  endpoint: string;
  /** Path used to list rows in the admin (may include drafts). */
  listEndpoint?: string;
  title: string;
  description: string;
  /** Blank form values for the create flow. */
  emptyForm: TForm;
  /** Maps an existing record onto form values for editing. */
  toForm: (item: T) => TForm;
  /** Maps form values onto the request body. */
  toPayload: (form: TForm) => Record<string, unknown>;
  /** Renders the form body. */
  renderForm: (form: TForm, set: <K extends keyof TForm>(key: K, value: TForm[K]) => void) => ReactNode;
  /** Row summary in the list. */
  renderRow: (item: T) => ReactNode;
  keyOf: (item: T) => string;
  labelOf: (item: T) => string;
  /** Returns items from whatever shape the endpoint returns. */
  unwrap?: (data: unknown) => T[];
}

/** Must stay at or below the API's MAX_PAGE_SIZE, which rejects anything larger. */
const PAGE_SIZE = 100;

/** Stops a bad totalPages value from looping the admin list forever. */
const MAX_PAGES = 20;

const defaultUnwrap = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'items' in data) {
    return (data as { items: T[] }).items;
  }
  return [];
};

export function ResourceManager<T, TForm extends object>({
  config,
}: {
  config: ResourceConfig<T, TForm>;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<{ item: T | null; form: TForm } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { notify } = useToast();
  const unwrap = config.unwrap ?? defaultUnwrap<T>;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = config.listEndpoint ?? config.endpoint;
      const collected: T[] = [];
      let page = 1;
      let totalPages = 1;

      // Walk the pages rather than asking for one oversized page: the API
      // caps `limit` at PAGE_SIZE, and a larger value is a 400.
      do {
        const { data } = await apiClient.get(url, {
          params: { page, limit: PAGE_SIZE },
        });

        collected.push(...unwrap(data));

        // Endpoints returning a bare array are unpaginated — one pass is all.
        totalPages =
          data && typeof data === 'object' && 'totalPages' in data
            ? (data as { totalPages: number }).totalPages
            : 1;
        page += 1;
      } while (page <= totalPages && page <= MAX_PAGES);

      setItems(collected);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoint, config.listEndpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = <K extends keyof TForm>(key: K, value: TForm[K]) => {
    setEditing((current) =>
      current ? { ...current, form: { ...current.form, [key]: value } } : current,
    );
  };

  const save = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      const payload = config.toPayload(editing.form);
      if (editing.item) {
        await apiClient.patch(
          `${config.endpoint}/${config.keyOf(editing.item)}`,
          payload,
        );
        notify('success', `${config.title} updated.`);
      } else {
        await apiClient.post(config.endpoint, payload);
        notify('success', `${config.title} created.`);
      }
      setEditing(null);
      await load();
    } catch (err) {
      notify('error', extractErrorMessage(err, 'Save failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`${config.endpoint}/${config.keyOf(pendingDelete)}`);
      notify('success', `Deleted "${config.labelOf(pendingDelete)}".`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      notify('error', extractErrorMessage(err, 'Delete failed.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{config.title}</h1>
          <p className="mt-1 text-[0.8rem] text-slate-500">
            {config.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-violet-accent/40 hover:text-white"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setEditing({ item: null, form: config.emptyForm })}
            className="gradient-surface inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-white shadow-lg shadow-accent-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="glass flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {error && !isLoading && (
        <div className="glass flex flex-col items-center gap-3 p-8 text-center">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="glass p-10 text-center text-sm text-slate-500">
          Nothing here yet. Use <strong className="text-slate-300">New</strong> to
          add the first entry.
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={config.keyOf(item)}
              className="glass glass-hover flex items-center gap-4 p-4"
            >
              <div className="min-w-0 flex-1">{config.renderRow(item)}</div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setEditing({ item, form: config.toForm(item) })
                  }
                  aria-label={`Edit ${config.labelOf(item)}`}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:border-violet-accent/40 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(item)}
                  aria-label={`Delete ${config.labelOf(item)}`}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:border-rose-400/50 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit drawer */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          >
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => !isSaving && setEditing(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
              className="glass relative my-4 w-full max-w-2xl border-white/12 p-5 sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2 className="text-base font-bold">
                  {editing.item ? 'Edit' : 'New'} {config.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  aria-label="Close"
                  className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {config.renderForm(editing.form, setField)}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="gradient-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editing.item ? 'Save changes' : 'Create'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => !isDeleting && setPendingDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass relative w-full max-w-sm border-rose-400/25 p-5 text-center"
            >
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-400" />
              <h2 className="mb-1.5 text-sm font-bold">Delete this entry?</h2>
              <p className="mb-5 text-[0.78rem] leading-relaxed text-slate-400">
                <span className="text-slate-200">
                  {config.labelOf(pendingDelete)}
                </span>{' '}
                will be permanently removed. This cannot be undone.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
