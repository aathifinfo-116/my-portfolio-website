import { Sidebar } from '@/components/layout/Sidebar';
import { HeroSection } from '@/components/sections/HeroSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { CertificationsSection } from '@/components/sections/CertificationsSection';
import { DocumentsSection } from '@/components/sections/DocumentsSection';
import { AwardsSection } from '@/components/sections/AwardsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { useProfile } from '@/hooks/usePortfolioData';

/**
 * The public portfolio. Profile is fetched once here and passed down: the
 * sidebar, hero, about and contact panels all read from the same record.
 */
export function PortfolioPage() {
  const { data: profile, isLoading, error, refetch } = useProfile();

  return (
    <div className="relative min-h-dvh bg-ink-950">
      {/* Fixed background wash, sits behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-accent-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-accent/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-fuchsia-accent/8 blur-[120px]" />
      </div>

      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-violet-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar profile={profile} />

      <main className="relative pt-16 lg:ml-[17rem] lg:pt-0">
        <div className="mx-auto max-w-6xl">
          <HeroSection
            profile={profile}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
          />
          <AboutSection profile={profile} />
          <ServicesSection />
          <ProjectsSection />
          <CertificationsSection />
          <DocumentsSection />
          <AwardsSection />
          <ContactSection profile={profile} />

          <footer className="border-t border-white/8 px-5 py-6 text-center sm:px-8">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} {profile?.name ?? 'Aathif Thahir'}. Built
              with React, NestJS &amp; PostgreSQL.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
