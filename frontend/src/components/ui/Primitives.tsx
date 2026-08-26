import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Blocks,
  BookOpen,
  Boxes,
  Braces,
  Briefcase,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  Medal,
  Monitor,
  Network,
  Palette,
  RefreshCw,
  Rocket,
  ScrollText,
  Server as ServerIcon,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  Workflow,
  Zap,
} from 'lucide-react';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * Explicit registry rather than `import * as Icons`. The barrel import pulls
 * all ~6000 Lucide icons into the bundle and defeats tree-shaking; naming the
 * ones we actually offer keeps the bundle small.
 *
 * Add an entry here when a new iconName is used in the database.
 */
const ICON_REGISTRY: Record<string, IconComponent> = {
  Award,
  BadgeCheck,
  Blocks,
  BookOpen,
  Boxes,
  Braces,
  Briefcase,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  Medal,
  Monitor,
  Network,
  Palette,
  Rocket,
  ScrollText,
  Server: ServerIcon,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  Workflow,
  Zap,
};

/**
 * Resolves a Lucide icon by the name stored in the database, so the admin can
 * change icons without a frontend deploy. Falls back to a neutral glyph.
 */
export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Resolved = ICON_REGISTRY[name] ?? Sparkles;
  return <Resolved className={className} />;
}

// ---------- Layout helpers ----------

export function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-24 px-5 py-14 sm:px-8', className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="section-label mb-2">{label}</p>
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Fade-and-rise on scroll into view; runs once per element. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---------- Buttons ----------

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  download?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  variant?: 'gradient' | 'ghost';
}

export function ActionButton({
  children,
  onClick,
  href,
  download,
  type = 'button',
  disabled,
  className,
  variant = 'gradient',
}: ButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5',
    'text-sm font-semibold transition-all duration-300',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variant === 'gradient'
      ? 'gradient-surface text-white shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-violet-accent/40 hover:-translate-y-0.5'
      : 'border border-white/12 bg-white/[0.04] text-slate-200 hover:border-violet-accent/50 hover:text-white',
    className,
  );

  if (href) {
    const isExternal = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        download={download}
        className={base}
        {...(isExternal && !download
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  );
}

export function TechTag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-violet-accent/25 bg-violet-accent/10 px-2.5 py-1 text-[0.7rem] font-medium text-violet-200">
      {label}
    </span>
  );
}

// ---------- Async states ----------

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'glass animate-pulse p-6',
        'before:absolute before:inset-0 before:rounded-[var(--radius-card)]',
        className,
      )}
    >
      <div className="mb-4 h-11 w-11 rounded-xl bg-white/8" />
      <div className="mb-3 h-4 w-2/3 rounded bg-white/8" />
      <div className="mb-2 h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-4/5 rounded bg-white/5" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-rose-400" />
      <p className="text-sm text-slate-400">{message}</p>
      {onRetry && (
        <ActionButton variant="ghost" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </ActionButton>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass p-10 text-center text-sm text-slate-500">{message}</div>
  );
}
