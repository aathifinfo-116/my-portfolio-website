import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Presentation,
  X,
} from 'lucide-react';
import { ActionButton, cn } from './Primitives';
import { downloadFileWithFeedback } from '@/lib/downloadFile';
import { useToast } from './Toast';
import { formatFileSize } from '@/lib/formatters';
import type { DocumentFileType } from '@/types/api';

export interface ViewerFile {
  title: string;
  subtitle?: string | null;
  /** Direct URL used for inline preview (PDF only). */
  fileUrl: string;
  /** URL that triggers the save dialog. */
  downloadUrl: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSizeBytes?: number;
  uploadedAt?: string;
}

const FORMAT_META: Record<
  DocumentFileType,
  { label: string; icon: typeof FileText; accent: string }
> = {
  pdf: { label: 'PDF', icon: FileText, accent: 'from-rose-500 to-red-500' },
  docx: { label: 'Word', icon: FileText, accent: 'from-blue-500 to-sky-500' },
  pptx: {
    label: 'PowerPoint',
    icon: Presentation,
    accent: 'from-orange-500 to-amber-500',
  },
};

interface DocumentViewerModalProps {
  file: ViewerFile | null;
  onClose: () => void;
}

/**
 * PDFs preview inline in an iframe. Word and PowerPoint have no native browser
 * renderer, so those show a described fallback with download and open actions
 * rather than an empty frame.
 */
export function DocumentViewerModal({
  file,
  onClose,
}: DocumentViewerModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { notify } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!file) return;
    setIsDownloading(true);
    await downloadFileWithFeedback(file.downloadUrl, file.fileName, (message) =>
      notify('error', message),
    );
    setIsDownloading(false);
  };

  // Escape closes; body scroll locks while open.
  useEffect(() => {
    if (!file) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [file, onClose]);

  const meta = file ? FORMAT_META[file.fileType] : null;
  const FormatIcon = meta?.icon ?? FileText;

  return (
    <AnimatePresence>
      {file && meta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
        >
          <button
            type="button"
            aria-label="Close document viewer"
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Preview of ${file.title}`}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative flex h-full max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden border-white/12"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/8 p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
                    meta.accent,
                  )}
                >
                  <FormatIcon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {file.title}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.7rem] text-slate-500">
                    <span className="font-semibold text-violet-300">
                      {meta.label}
                    </span>
                    {file.fileSizeBytes ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{formatFileSize(file.fileSizeBytes)}</span>
                      </>
                    ) : null}
                    {file.subtitle ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate">{file.subtitle}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:border-violet-accent/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview body */}
            <div className="flex-1 overflow-hidden bg-ink-950/60">
              {file.fileType === 'pdf' ? (
                <iframe
                  src={`${file.fileUrl}#view=FitH`}
                  title={`${file.title} preview`}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div
                    className={cn(
                      'inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br',
                      meta.accent,
                    )}
                  >
                    <FormatIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="max-w-sm">
                    <p className="mb-1.5 text-sm font-semibold text-white">
                      {meta.label} files can't preview in the browser
                    </p>
                    <p className="text-[0.8rem] leading-relaxed text-slate-400">
                      Browsers have no built-in renderer for {meta.label}{' '}
                      documents. Download the file to open it in Office, or use
                      the open-in-new-tab option if you have a viewer installed.
                    </p>
                  </div>
                  <p className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[0.7rem] text-slate-500">
                    {file.fileName}
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/8 p-4">
              <ActionButton
                variant="ghost"
                href={file.fileUrl}
                className="!px-4 !py-2 !text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </ActionButton>
              <ActionButton
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                className="!px-4 !py-2 !text-xs"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download
              </ActionButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
