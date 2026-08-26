import { Calendar } from 'lucide-react';
import {
  DynamicIcon,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
  SkeletonGrid,
} from '@/components/ui/Primitives';
import { useAwards } from '@/hooks/usePortfolioData';

const ACCENTS = [
  'from-amber-400 to-orange-500',
  'from-violet-accent to-fuchsia-accent',
  'from-accent-500 to-violet-accent',
  'from-emerald-400 to-teal-500',
];

export function AwardsSection() {
  const { data: awards, isLoading, error, refetch } = useAwards();

  return (
    <Section id="awards">
      <SectionHeading label="Recognition" title="Awards & Honors" />

      {isLoading && <SkeletonGrid count={3} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!isLoading && !error && awards?.length === 0 && (
        <EmptyState message="No awards published yet." />
      )}

      {!isLoading && !error && awards && awards.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {awards.map((award, index) => (
            <Reveal key={award.id} delay={index * 0.08}>
              <article className="glass glass-hover group relative h-full overflow-hidden p-5">
                {/* Corner wash that warms on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative flex items-start gap-4">
                  <div
                    className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                      ACCENTS[index % ACCENTS.length]
                    } shadow-lg shadow-amber-500/20 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <DynamicIcon
                      name={award.iconName}
                      className="h-5 w-5 text-white"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-sm font-semibold leading-snug">
                      {award.title}
                    </h3>
                    <p className="mb-1.5 text-[0.75rem] text-violet-300/80">
                      {award.issuer}
                    </p>
                    {award.year && (
                      <p className="mb-2.5 inline-flex items-center gap-1 text-[0.68rem] text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {award.year}
                      </p>
                    )}
                    {award.description && (
                      <p className="text-[0.78rem] leading-relaxed text-slate-400">
                        {award.description}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
