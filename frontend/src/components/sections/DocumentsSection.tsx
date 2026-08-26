import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  Loader2,
  HardDrive,
  Presentation,
  Tag,
} from 'lucide-react';
import { portfolioApi } from '@/lib/portfolioApi';
import { resolveFileUrl } from '@/lib/apiClient';
import { formatFileSize, formatUploadDate } from '@/lib/formatters';
import { downloadFileWithFeedback } from '@/lib/downloadFile';
import { useToast } from '@/components/ui/Toast';
import {
  EmptyState,
  ErrorState,
  Section,
  SectionHeading,
  SkeletonGrid,
  cn,
} from '@/components/ui/Primitives';
import { FilterChips } from '@/components/ui/FilterChips';
import { PaginatedGrid } from '@/components/ui/PaginatedGrid';
import {
  DocumentViewerModal,
  type ViewerFile,
} from '@/components/ui/DocumentViewerModal';
import { useDocumentFacets, useDocuments } from '@/hooks/usePortfolioData';
import {
  DOCUMENT_DOMAINS,
  type DocumentDomainFilter,
  type DocumentFileType,
  type DocumentFormatFilter,
  type StudyDocument,
} from '@/types/api';

const DOMAIN_FILTERS: readonly DocumentDomainFilter[] = [
  'All',
  ...DOCUMENT_DOMAINS,
];

const FORMAT_FILTERS: readonly DocumentFormatFilter[] = [
  'All',
  'pdf',
  'docx',
  'pptx',
];

const FORMAT_LABELS: Record<DocumentFormatFilter, string> = {
  All: 'All Formats',
  pdf: 'PDF',
  docx: 'Word',
  pptx: 'PPTX',
};

const FORMAT_META: Record<
  DocumentFileType,
  { label: string; icon: typeof FileText; accent: string; badge: string }
> = {
  pdf: {
    label: 'PDF',
    icon: FileText,
    accent: 'from-rose-500 to-red-500',
    badge: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  },
  docx: {
    label: 'Word',
    icon: FileText,
    accent: 'from-blue-500 to-sky-500',
    badge: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  },
  pptx: {
    label: 'PPTX',
    icon: Presentation,
    accent: 'from-orange-500 to-amber-500',
    badge: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  },
};

export function DocumentsSection() {
  const [domain, setDomain] = useState<DocumentDomainFilter>('All');
  const [format, setFormat] = useState<DocumentFormatFilter>('All');
  const [viewerFile, setViewerFile] = useState<ViewerFile | null>(null);

  // Both filters go to the API, which combines them with AND.
  const { data: documents, isLoading, error, refetch } = useDocuments(
    domain,
    format,
  );
  const { data: facets } = useDocumentFacets();

  return (
    <Section id="documents">
      <SectionHeading
        label="Library"
        title="Documents & Study Materials"
      />

      <div className="mb-7 space-y-3">
        <FilterChips
          options={DOMAIN_FILTERS}
          active={domain}
          onChange={setDomain}
          counts={facets?.domains}
          layoutId="doc-domain-pill"
          label="Filter by topic"
        />

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Format
          </span>
          <FilterChips
            options={FORMAT_FILTERS}
            active={format}
            onChange={setFormat}
            counts={facets?.fileTypes}
            layoutId="doc-format-pill"
            label="Filter by file format"
            size="compact"
            renderLabel={(value) => FORMAT_LABELS[value]}
          />
        </div>
      </div>

      {isLoading && <SkeletonGrid count={4} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!isLoading && !error && documents?.length === 0 && (
        <EmptyState
          message={
            domain === 'All' && format === 'All'
              ? 'No documents published yet.'
              : 'No documents match these filters.'
          }
        />
      )}

      {!isLoading && !error && documents && documents.length > 0 && (
        <PaginatedGrid
          items={documents}
          pageSize={6}
          keyOf={(doc) => doc.id}
          resetKey={`${domain}-${format}`}
          itemNoun="documents"
          renderItem={(doc, index) => (
            <DocumentCard document={doc} index={index} onView={setViewerFile} />
          )}
        />
      )}

      <DocumentViewerModal
        file={viewerFile}
        onClose={() => setViewerFile(null)}
      />
    </Section>
  );
}

function DocumentCard({
  document,
  index,
  onView,
}: {
  document: StudyDocument;
  index: number;
  onView: (file: ViewerFile) => void;
}) {
  const meta = FORMAT_META[document.fileType];
  const Icon = meta.icon;
  const { notify } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadFileWithFeedback(downloadUrl, document.fileName, (message) =>
      notify('error', message),
    );
    setIsDownloading(false);
  };

  const previewUrl = resolveFileUrl(document.fileUrl) ?? document.fileUrl;
  const downloadUrl = portfolioApi.documentDownloadUrl(document.id);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="glass glass-hover group flex h-full flex-col p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110',
            meta.accent,
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        <span
          className={cn(
            'rounded-full border px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide',
            meta.badge,
          )}
        >
          {meta.label}
        </span>
      </div>

      <h3 className="mb-2 text-sm font-semibold leading-snug">
        {document.title}
      </h3>

      {document.description && (
        <p className="mb-4 flex-1 text-[0.78rem] leading-relaxed text-slate-400">
          {document.description}
        </p>
      )}

      {/* Metadata row */}
      <dl className="mb-4 grid grid-cols-2 gap-2 text-[0.68rem] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3 w-3 shrink-0 text-violet-accent/70" />
          <dt className="sr-only">Category</dt>
          <dd className="truncate">{document.topic ?? document.domain}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3 w-3 shrink-0 text-violet-accent/70" />
          <dt className="sr-only">File size</dt>
          <dd>{formatFileSize(document.fileSizeBytes)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 shrink-0 text-violet-accent/70" />
          <dt className="sr-only">Uploaded</dt>
          <dd>{formatUploadDate(document.uploadedAt)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-accent/60" />
          <dt className="sr-only">Domain</dt>
          <dd className="truncate">{document.domain}</dd>
        </div>
      </dl>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={() =>
            onView({
              title: document.title,
              subtitle: document.topic ?? document.domain,
              fileUrl: previewUrl,
              downloadUrl,
              fileName: document.fileName,
              fileType: document.fileType,
              fileSizeBytes: document.fileSizeBytes,
              uploadedAt: document.uploadedAt,
            })
          }
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-violet-accent/30 bg-violet-accent/10 px-3 py-2 text-[0.7rem] font-semibold text-violet-200 transition-colors hover:bg-violet-accent/20 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={isDownloading}
          aria-label={`Download ${document.title}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[0.7rem] font-semibold text-slate-400 transition-colors hover:border-violet-accent/40 hover:text-white disabled:opacity-60"
        >
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download
        </button>
      </div>
    </motion.article>
  );
}
