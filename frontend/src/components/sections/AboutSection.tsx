import { Code2, Cpu, Database, Globe } from 'lucide-react';
import { Reveal, Section, SectionHeading } from '@/components/ui/Primitives';
import type { Profile } from '@/types/api';

const HIGHLIGHTS = [
  {
    icon: Cpu,
    title: 'Backend & Microservices',
    body: 'Java, Spring Boot and NestJS services designed around clear domain boundaries.',
  },
  {
    icon: Globe,
    title: 'Modern Frontends',
    body: 'React and TypeScript interfaces that stay fast and maintainable as they grow.',
  },
  {
    icon: Database,
    title: 'Data Modelling',
    body: 'Normalised PostgreSQL and Oracle schemas with considered indexing strategies.',
  },
  {
    icon: Code2,
    title: 'Delivery Practices',
    body: 'Containerised builds, CI/CD pipelines and reviews that keep releases routine.',
  },
];

export function AboutSection({ profile }: { profile: Profile | null }) {
  return (
    <Section id="about">
      <SectionHeading label="About Me" title="A Little Background" />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <div className="glass h-full p-6">
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              {profile?.bio ??
                'Results-driven Software Engineer with 2.5+ years of experience in backend microservices, Java, Spring Boot, NestJS, and React.js.'}
            </p>
            <p className="text-[0.85rem] leading-relaxed text-slate-400">
              I work most often on the systems behind the interface — integration
              layers, batch pipelines and the data models underneath them — and I
              enjoy the part where a tangled manual process turns into something
              dependable enough that nobody has to think about it any more.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.07}>
              <article className="glass glass-hover h-full p-4">
                <item.icon className="mb-3 h-5 w-5 text-violet-accent" />
                <h3 className="mb-1.5 text-[0.85rem] font-semibold">{item.title}</h3>
                <p className="text-[0.75rem] leading-relaxed text-slate-400">
                  {item.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
