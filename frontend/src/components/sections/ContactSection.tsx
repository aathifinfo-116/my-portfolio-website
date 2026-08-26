import { useState, type FormEvent } from 'react';
import { Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { portfolioApi } from '@/lib/portfolioApi';
import {
  ActionButton,
  Reveal,
  Section,
  SectionHeading,
  cn,
} from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';
import type { Profile } from '@/types/api';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot — hidden from real users, so anything here means a bot. */
  website: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

/** Mirrors the backend DTO rules so users get feedback before a round-trip. */
function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Please enter your name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (form.message.trim().length > 5000) {
    errors.message = 'Message must be under 5000 characters.';
  }

  return errors;
}

export function ContactSection({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useToast();

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    // Clear the error as soon as the user starts correcting the field.
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      notify('error', 'Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await portfolioApi.submitInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
        website: form.website,
      });
      notify('success', response.message);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      notify('error', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactRows = [
    { icon: Mail, label: 'Email', value: profile?.email, href: `mailto:${profile?.email}` },
    {
      icon: Phone,
      label: 'Phone',
      value: profile?.phone,
      href: `tel:${profile?.phone?.replace(/\s/g, '')}`,
    },
    { icon: MapPin, label: 'Location', value: profile?.location, href: null },
  ].filter((row) => row.value);

  return (
    <Section id="contact" className="pb-20">
      <SectionHeading label="Get In Touch" title="Let's Work Together" />

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Contact details panel */}
        <Reveal>
          <div className="glass relative h-full overflow-hidden p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-accent-500/25 blur-3xl"
            />
            <div className="relative">
              <div className="gradient-surface mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                <Send className="h-5 w-5 text-white" />
              </div>

              <h3 className="mb-2 text-lg font-bold">Have a project in mind?</h3>
              <p className="mb-6 text-[0.82rem] leading-relaxed text-slate-400">
                {profile?.availabilityNote ??
                  "Let's create something amazing together. I usually reply within a day."}
              </p>

              <ul className="space-y-3.5">
                {contactRows.map((row) => (
                  <li key={row.label} className="flex items-center gap-3">
                    <span className="glass flex h-9 w-9 shrink-0 items-center justify-center">
                      <row.icon className="h-4 w-4 text-violet-accent" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                        {row.label}
                      </p>
                      {row.href ? (
                        <a
                          href={row.href}
                          className="block truncate text-[0.82rem] text-slate-200 transition-colors hover:text-violet-300"
                        >
                          {row.value}
                        </a>
                      ) : (
                        <p className="truncate text-[0.82rem] text-slate-200">
                          {row.value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Form */}
        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} noValidate className="glass h-full p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="name"
                label="Your Name"
                value={form.name}
                error={errors.name}
                onChange={(value) => update('name', value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
              <Field
                id="email"
                label="Your Email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={(value) => update('email', value)}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </div>

            <div className="mt-4">
              <Field
                id="subject"
                label="Subject"
                optional
                value={form.subject}
                error={errors.subject}
                onChange={(value) => update('subject', value)}
                placeholder="Project enquiry"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="message"
                className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-slate-400"
              >
                Your Message
              </label>
              <textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                placeholder="Tell me a little about what you're building..."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'message-error' : undefined}
                className={cn(
                  'w-full resize-y rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-200',
                  'placeholder:text-slate-600 transition-colors outline-none',
                  errors.message
                    ? 'border-rose-400/50'
                    : 'border-white/10 focus:border-violet-accent/60',
                )}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                {errors.message ? (
                  <p id="message-error" className="text-[0.7rem] text-rose-400">
                    {errors.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="shrink-0 text-[0.68rem] text-slate-600">
                  {form.message.length}/5000
                </span>
              </div>
            </div>

            {/* Honeypot: visually and programmatically hidden from real users. */}
            <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => update('website', event.target.value)}
              />
            </div>

            <div className="mt-5">
              <ActionButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="h-4 w-4" />
                  </>
                )}
              </ActionButton>
            </div>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  autoComplete?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  optional,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-slate-400"
      >
        {label}
        {optional && <span className="ml-1 normal-case text-slate-600">(optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-200',
          'placeholder:text-slate-600 transition-colors outline-none',
          error ? 'border-rose-400/50' : 'border-white/10 focus:border-violet-accent/60',
        )}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[0.7rem] text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
