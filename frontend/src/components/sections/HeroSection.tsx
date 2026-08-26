import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award as AwardIcon,
  Briefcase,
  Mail,
  MapPin,
  Smile,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ActionButton, ErrorState, Section } from '@/components/ui/Primitives';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/types/api';

interface HeroSectionProps {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function HeroSection({
  profile,
  isLoading,
  error,
  onRetry,
}: HeroSectionProps) {
  if (error) {
    return (
      <Section id="home">
        <ErrorState message={error} onRetry={onRetry} />
      </Section>
    );
  }

  const stats = [
    {
      icon: TrendingUp,
      value: profile?.yearsExperience ?? '2.5+',
      label: 'Years Experience',
      accent: 'from-accent-500 to-violet-accent',
    },
    {
      icon: Briefcase,
      value: profile ? `${profile.projectsCompleted}+` : '—',
      label: 'Projects Completed',
      accent: 'from-violet-accent to-fuchsia-accent',
    },
    {
      icon: Smile,
      value: profile ? `${profile.happyClients}+` : '—',
      label: 'Happy Clients',
      accent: 'from-blue-500 to-accent-500',
    },
    {
      icon: AwardIcon,
      value: profile ? `${profile.awardsWon}` : '—',
      label: 'Awards Won',
      accent: 'from-fuchsia-accent to-rose-500',
    },
  ];

  return (
    <Section id="home" className="pt-8">
      <div className="glass relative overflow-hidden p-7 sm:p-10">
        {/* Ambient gradient wash behind the hero copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-violet-accent/25 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-accent-500/20 blur-[100px]"
        />

        {/* Text ~57%, portrait ~43% from lg up; single column below that. */}
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_0.76fr] lg:gap-10">
          <div className="order-1 self-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-accent/25 bg-violet-accent/10 px-3 py-1.5 text-xs font-medium text-violet-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Hello, I'm
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-3 text-4xl font-extrabold leading-[1.1] sm:text-5xl xl:text-6xl"
            >
              {(profile?.name ?? 'Aathif Thahir').split(' ')[0]}{' '}
              <span className="gradient-text">
                {(profile?.name ?? 'Aathif Thahir').split(' ').slice(1).join(' ')}
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mb-4 text-xl font-semibold leading-snug text-slate-200 sm:text-2xl"
            >
              {profile?.headline ??
                'I Build Scalable Microservices & Modern Web Applications'}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mb-6 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-[0.95rem]"
            >
              {profile?.bio ??
                'Results-driven Software Engineer with 2.5+ years of experience in backend microservices, Java, Spring Boot, NestJS, and React.js.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="flex flex-wrap items-center gap-3"
            >
              <ActionButton
                onClick={() =>
                  document
                    .getElementById('portfolio')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                View My Work
                <ArrowRight className="h-4 w-4" />
              </ActionButton>
              <ActionButton
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById('contact')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <Mail className="h-4 w-4" />
                Contact Me
              </ActionButton>
            </motion.div>

            {profile?.location && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-5 flex items-center gap-1.5 text-xs text-slate-500"
              >
                <MapPin className="h-3.5 w-3.5" />
                Based in {profile.location}
              </motion.p>
            )}
          </div>

          {/* Borderless portrait: no frame, no fill — the cutout sits on the card. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative order-2 mx-auto w-full max-w-[16rem] sm:max-w-[19rem] lg:mx-0 lg:max-w-none lg:self-end"
          >
            {/* Ambient pool of light behind the subject, replacing the frame. */}
            <div
              aria-hidden
              className="portrait-glow pointer-events-none absolute -inset-x-8 -top-6 bottom-0 animate-glow blur-2xl"
            />

            <Avatar
              src={profile?.avatarUrl}
              name={profile?.name}
              isLoading={isLoading}
              showBackdrop={false}
              className="relative aspect-square w-full drop-shadow-[0_18px_45px_rgba(88,28,135,0.55)]"
              imageClassName="portrait-cutout object-bottom"
              initialsClassName="text-6xl text-white/15"
            />

            {/* Overlays the lower-right of the portrait, clear of the face. */}
            <div className="glass absolute bottom-1 right-0 flex items-center gap-2 px-3 py-2 lg:bottom-3">
              <p className="gradient-text text-lg font-extrabold leading-none">
                {profile?.yearsExperience ?? '2.5+'}
              </p>
              <p className="text-[0.6rem] leading-tight text-slate-400">
                Years
                <br />
                Experience
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stat cards */}
        <div className="relative mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.07 }}
              className="glass glass-hover p-4"
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent}`}
              >
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-extrabold text-white sm:text-2xl">
                {isLoading ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-white/10" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[0.7rem] text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
