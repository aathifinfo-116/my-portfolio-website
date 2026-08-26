import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { resolveFileUrl } from '@/lib/apiClient';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
  SkeletonGrid,
} from '@/components/ui/Primitives';
import { FilterChips } from '@/components/ui/FilterChips';
import { PaginatedGrid } from '@/components/ui/PaginatedGrid';
import {
  DocumentViewerModal,
  type ViewerFile,
} from '@/components/ui/DocumentViewerModal';
import { useCertifications } from '@/hooks/usePortfolioData';
import type { Certification, CertificationCategory } from '@/types/api';

type Filter = 'All' | CertificationCategory;

const FILTERS: readonly Filter[] = [
  'All',
  'Academic Degree',
  'Professional',
  'Certification',
];

const CATEGORY_STYLES: Record<
  CertificationCategory,
  { icon: typeof GraduationCap; gradient: string }
> = {
  'Academic Degree': {
    icon: GraduationCap,
    gradient: 'from-accent-500 to-violet-accent',
  },
  Professional: { icon: Briefcase, gradient: 'from-emerald-500 to-teal-500' },
  Certification: {
    icon: ScrollText,
    gradient: 'from-violet-accent to-fuchsia-accent',
  },
};

export function CertificationsSection() {
  const { data: certifications, isLoading, error, refetch } = useCertifications();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [viewerFile, setViewerFile] = useState<ViewerFile | null>(null);

  // Filtering is client-side: the list is small and already loaded.
  const visible = useMemo(() => {
    if (!certifications) return [];
    return activeFilter === 'All'
      ? certifications
      : certifications.filter((item) => item.category === activeFilter);
  }, [certifications, activeFilter]);

  const counts = useMemo(() => {
    const result: Partial<Record<Filter, number>> = {
      All: certifications?.length ?? 0,
    };
    certifications?.forEach((item) => {
      result[item.category] = (result[item.category] ?? 0) + 1;
    });
    return result;
  }, [certifications]);

  return (
    <Section id="studies">
      <SectionHeading label="Education" title="Studies & Certifications" />

      <div className="mb-7">
        <FilterChips
          options={FILTERS}
          active={activeFilter}
          onChange={setActiveFilter}
          counts={counts}
          layoutId="cert-filter-pill"
          label="Filter by category"
        />
      </div>

      {isLoading && <SkeletonGrid count={3} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!isLoading && !error && visible.length === 0 && (
        <EmptyState
          message={
            activeFilter === 'All'
              ? 'No records published yet.'
              : `No ${activeFilter} records yet.`
          }
        />
      )}

      {!isLoading && !error && visible.length > 0 && (
        <PaginatedGrid
          items={visible}
          pageSize={6}
          keyOf={(item) => item.id}
          resetKey={activeFilter}
          itemNoun="records"
          gridClassName="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          renderItem={(item, index) => (
            <Reveal delay={index * 0.07}>
              <CertificationCard certification={item} onView={setViewerFile} />
            </Reveal>
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

function CertificationCard({
  certification,
  onView,
}: {
  certification: Certification;
  onView: (file: ViewerFile) => void;
}) {
  const style = CATEGORY_STYLES[certification.category];
  const Icon = style?.icon ?? ScrollText;

  const documentUrl = resolveFileUrl(certification.documentUrl);
  const badgeUrl = resolveFileUrl(certification.badgeUrl);

  return (
    <article className="glass glass-hover flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        {badgeUrl ? (
          <img
            src={badgeUrl}
            alt=""
            className="h-11 w-11 rounded-xl object-contain"
          />
        ) : (
          <div
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
              style?.gradient ?? 'from-accent-500 to-violet-accent'
            } shadow-lg shadow-violet-accent/20`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}

        {certification.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[0.62rem] font-semibold text-emerald-300">
            <BadgeCheck className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>

      <span className="mb-2 self-start rounded-full border border-white/10 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400">
        {certification.category}
      </span>

      <h3 className="mb-2 text-sm font-semibold leading-snug">
        {certification.title}
      </h3>

      <p className="mb-1 flex items-start gap-1.5 text-[0.75rem] text-violet-300/80">
        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {certification.institution}
      </p>

      {certification.issuedOn && (
        <p className="mb-3 text-[0.7rem] text-slate-500">
          {certification.issuedOn}
        </p>
      )}

      {certification.description && (
        <p className="mb-4 flex-1 text-[0.78rem] leading-relaxed text-slate-400">
          {certification.description}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        {documentUrl && (
          <ActionButton
            onClick={() =>
              onView({
                title: certification.title,
                subtitle: certification.institution,
                fileUrl: documentUrl,
                downloadUrl: documentUrl,
                fileName: certification.documentName ?? 'credential.pdf',
                fileType: 'pdf',
                fileSizeBytes: certification.documentSizeBytes ?? undefined,
              })
            }
            className="!px-3 !py-1.5 !text-[0.7rem]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            View Verification
          </ActionButton>
        )}

        {certification.credentialUrl && (
          <ActionButton
            variant="ghost"
            href={certification.credentialUrl}
            className="!px-3 !py-1.5 !text-[0.7rem]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Verify Online
          </ActionButton>
        )}

        {!documentUrl && !certification.credentialUrl && (
          <span className="text-[0.68rem] text-slate-600">
            No credential document attached
          </span>
        )}
      </div>
    </article>
  );
}
