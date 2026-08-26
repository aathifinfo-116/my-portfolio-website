import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Award as AwardIcon,
  Briefcase,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  Loader2,
  Mail,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

import { portfolioApi } from '@/lib/portfolioApi';
import { downloadFileWithFeedback } from '@/lib/downloadFile';
import { useToast } from '@/components/ui/Toast';
import { ActionButton, DynamicIcon, cn } from '@/components/ui/Primitives';
import { BRAND_ICONS } from '@/components/ui/BrandIcons';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/types/api';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'about', label: 'About', icon: User },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio', icon: FileText },
  { id: 'studies', label: 'Studies & Certs', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'awards', label: 'Awards', icon: AwardIcon },
  { id: 'contact', label: 'Contact', icon: Mail },
];

interface SidebarProps {
  profile: Profile | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  /**
   * Highlights the nav item for whichever section is currently in view.
   * rootMargin biases the trigger point toward the upper third of the viewport.
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.5] },
    );

    NAV_ITEMS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Prevent the page behind the mobile drawer from scrolling.
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleNavigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileOpen(false);
  };

  const { notify } = useToast();
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);

  // Presence of the URL still gates the button; the bytes come from the
  // API endpoint, which sets Content-Disposition: attachment.
  const hasResume = Boolean(profile?.resumeUrl);

  const handleResumeDownload = async () => {
    setIsDownloadingCv(true);
    await downloadFileWithFeedback(
      portfolioApi.resumeDownloadUrl(),
      profile?.resumeFileName ?? 'Resume.pdf',
      (message) => notify('error', message),
    );
    setIsDownloadingCv(false);
  };
  return (
    <>
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/8 bg-ink-950/85 px-5 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={profile?.avatarUrl}
            name={profile?.name}
            className="h-9 w-9 rounded-xl"
            initialsClassName="text-sm"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">
              {profile?.name ?? 'Aathif Thahir'}
            </p>
            <p className="text-[0.7rem] text-slate-500">
              {profile?.title ?? 'Software Engineer'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileOpen}
          className="rounded-lg border border-white/10 p-2 text-slate-300"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-dvh w-[17rem] flex-col',
          'border-r border-white/8 bg-ink-900/95 backdrop-blur-xl',
          'transition-transform duration-300 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Ambient glow bleeding from the top of the rail */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-violet-accent/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-1.5 animate-glow rounded-2xl bg-gradient-to-br from-accent-500 to-violet-accent blur-md"
            />
            <Avatar
              src={profile?.avatarUrl}
              name={profile?.name}
              className="relative h-11 w-11 rounded-2xl"
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[0.95rem] font-bold text-white">
              {profile?.name ?? 'Aathif Thahir'}
            </p>
            <p className="truncate text-xs text-violet-300">
              {profile?.title ?? 'Software Engineer'}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
                      'text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                    )}
                  >
                    {isActive && (
                      // layoutId animates the pill between items on change.
                      <motion.span
                        layoutId="sidebar-active"
                        className="gradient-surface absolute inset-0 rounded-xl opacity-90"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon className="relative h-[1.05rem] w-[1.05rem] shrink-0" />
                    <span className="relative">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-4 px-4 pb-5 pt-4">
          {profile?.isAvailableForHire && (
            <div className="glass overflow-hidden p-4">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-accent/25 blur-2xl"
              />
              <div className="relative">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <p className="text-xs font-semibold text-white">
                    Available for Hire
                  </p>
                </div>
                <p className="mb-3 text-[0.72rem] leading-relaxed text-slate-400">
                  {profile.availabilityNote ??
                    "Let's build something amazing together!"}
                </p>
                <ActionButton
                  onClick={() => handleNavigate('contact')}
                  className="w-full !px-4 !py-2 !text-xs"
                >
                  Hire Me
                </ActionButton>
              </div>
            </div>
          )}

          {hasResume && (
            <div>
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Download CV
              </p>
              <button
                type="button"
                onClick={() => void handleResumeDownload()}
                disabled={isDownloadingCv}
                className="glass glass-hover flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-slate-300 disabled:opacity-60"
              >
                {isDownloadingCv ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-accent" />
                ) : (
                  <Download className="h-4 w-4 shrink-0 text-violet-accent" />
                )}
                <span className="truncate">
                  {profile?.resumeFileName ?? 'Resume.pdf'}
                </span>
              </button>
            </div>
          )}

          {profile?.socialLinks && profile.socialLinks.length > 0 && (
            <div>
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Follow Me
              </p>
              <div className="flex gap-2">
                {profile.socialLinks.map((link) => {
                  const Icon = BRAND_ICONS[link.icon];
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      className="glass glass-hover flex h-9 w-9 items-center justify-center text-slate-400 hover:text-white"
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4" />
                      ) : (
                        <DynamicIcon name={link.icon} className="h-4 w-4" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin entry point. Route is guarded; this is only a shortcut. */}
          <Link
            to="/admin/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-[0.72rem] font-semibold text-slate-400 transition-colors hover:border-violet-accent/40 hover:text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Login
          </Link>
        </div>
      </aside>
    </>
  );
}
