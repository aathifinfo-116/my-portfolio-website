import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ImageIcon } from 'lucide-react';
import { GithubIcon } from '@/components/ui/BrandIcons';
import { resolveFileUrl } from '@/lib/apiClient';
import {
  EmptyState,
  ErrorState,
  Section,
  SectionHeading,
  SkeletonGrid,
  TechTag,
  cn,
} from '@/components/ui/Primitives';
import { PaginatedGrid } from '@/components/ui/PaginatedGrid';
import { useProjectCounts, useProjects } from '@/hooks/usePortfolioData';
import type { Project, ProjectFilter } from '@/types/api';

const FILTERS: ProjectFilter[] = ['All', 'Microservices', 'Full-Stack', 'Cloud'];

export function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('All');
  const { data: projects, isLoading, error, refetch } = useProjects(activeFilter);
  const { data: counts } = useProjectCounts();

  return (
    <Section id="portfolio">
      <SectionHeading label="My Work" title="Featured Projects" />

      {/* Filter chips */}
      <div
        role="tablist"
        aria-label="Filter projects by category"
        className="mb-7 flex flex-wrap gap-2"
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          const count = counts?.[filter];
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'relative rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200',
                isActive
                  ? 'text-white'
                  : 'border border-white/10 text-slate-400 hover:border-violet-accent/40 hover:text-white',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="project-filter-pill"
                  className="gradient-surface absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">
                {filter}
                {typeof count === 'number' && (
                  <span className={cn('ml-1.5', isActive ? 'text-white/70' : 'text-slate-600')}>
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && <SkeletonGrid count={4} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!isLoading && !error && projects?.length === 0 && (
        <EmptyState
          message={
            activeFilter === 'All'
              ? 'No projects published yet.'
              : `No ${activeFilter} projects yet.`
          }
        />
      )}

      {!isLoading && !error && projects && projects.length > 0 && (
        <PaginatedGrid
          items={projects}
          pageSize={8}
          keyOf={(project) => project.id}
          resetKey={activeFilter}
          itemNoun="projects"
          gridClassName="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
          renderItem={(project, index) => (
            <ProjectCard project={project} index={index} />
          )}
        />
      )}
    </Section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const imageUrl = resolveFileUrl(project.imageUrl);
  const [imageStatus, setImageStatus] = useState<'idle' | 'loaded' | 'failed'>(
    'idle',
  );

  // A changed URL must clear a previous failure, or the fallback would stick.
  useEffect(() => {
    setImageStatus('idle');
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && imageStatus !== 'failed';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="glass glass-hover group flex h-full flex-col overflow-hidden"
    >
      {/* Preview header. The gradient sits underneath as the fallback, so a
          missing or broken image degrades to a styled panel, not a blank box. */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-ink-800 via-ink-850 to-ink-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <ImageIcon className="h-8 w-8 text-white/10" />
          <span className="px-4 text-center text-[0.65rem] font-medium text-white/20">
            {imageStatus === 'failed' ? 'Preview unavailable' : project.title}
          </span>
        </div>

        {showImage && (
          <img
            src={imageUrl ?? undefined}
            alt={project.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageStatus('loaded')}
            onError={() => setImageStatus('failed')}
            className={cn(
              'relative h-full w-full object-cover transition-all duration-500 group-hover:scale-105',
              imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}

        <span className="absolute left-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-[0.65rem] font-semibold text-violet-200 backdrop-blur-sm">
          {project.category}
        </span>

        {/* Link overlay, revealed on hover/focus-within for keyboard users */}
        {(project.githubUrl || project.liveUrl) && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/70 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} source on GitHub`}
                className="glass flex h-9 w-9 items-center justify-center text-white hover:text-violet-300"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} live demo`}
                className="glass flex h-9 w-9 items-center justify-center text-white hover:text-violet-300"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-sm font-semibold leading-snug">{project.title}</h3>
        {project.subtitle && (
          <p className="mb-2 text-[0.7rem] text-violet-300/80">{project.subtitle}</p>
        )}
        <p className="mb-3 line-clamp-3 flex-1 text-[0.78rem] leading-relaxed text-slate-400">
          {project.description}
        </p>

        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 4).map((tech) => (
              <TechTag key={tech} label={tech} />
            ))}
            {project.techStack.length > 4 && (
              <span className="self-center text-[0.65rem] text-slate-500">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
