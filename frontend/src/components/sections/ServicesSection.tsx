import {
  DynamicIcon,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
  SkeletonGrid,
  TechTag,
} from '@/components/ui/Primitives';
import { useServices } from '@/hooks/usePortfolioData';

export function ServicesSection() {
  const { data: services, isLoading, error, refetch } = useServices();

  return (
    <Section id="services">
      <SectionHeading label="What I Do" title="Services I Offer" />

      {isLoading && <SkeletonGrid count={4} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!isLoading && !error && services?.length === 0 && (
        <EmptyState message="No services published yet." />
      )}

      {!isLoading && !error && services && services.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 0.08}>
              <article className="glass glass-hover group h-full p-5">
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${
                    service.accentGradient ?? 'from-accent-500 to-violet-accent'
                  } shadow-lg shadow-violet-accent/20 transition-transform duration-300 group-hover:scale-110`}
                >
                  <DynamicIcon
                    name={service.iconName}
                    className="h-5 w-5 text-white"
                  />
                </div>

                <h3 className="mb-2 text-base font-semibold leading-snug">
                  {service.title}
                </h3>
                <p className="mb-4 text-[0.8rem] leading-relaxed text-slate-400">
                  {service.description}
                </p>

                {service.techTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {service.techTags.map((tag) => (
                      <TechTag key={tag} label={tag} />
                    ))}
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
