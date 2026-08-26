import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import type { Profile, SocialLink } from '@/types/api';
import {
  FileField,
  NumberField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../forms/Fields';

/**
 * Profile is a singleton, so this page edits one record in place rather than
 * using ResourceManager's list/create/delete flow.
 */
export function ProfilePage() {
  const [form, setForm] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    apiClient
      .get<Profile>('/profile')
      .then(({ data }) => setForm(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      // Server-managed columns are stripped: PATCH validation rejects unknowns.
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...payload
      } = form;
      await apiClient.patch('/profile', payload);
      notify('success', 'Profile saved.');
    } catch (err) {
      notify('error', extractErrorMessage(err, 'Save failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="glass p-8 text-center text-sm text-rose-300">
        {error ?? 'Profile unavailable.'}
      </div>
    );
  }

  const updateSocial = (index: number, patch: Partial<SocialLink>) => {
    const next = form.socialLinks.map((link, i) =>
      i === index ? { ...link, ...patch } : link,
    );
    set('socialLinks', next);
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Hero / Profile</h1>
          <p className="mt-1 text-[0.8rem] text-slate-500">
            The sidebar, hero banner and contact panel all read from this record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving}
          className="gradient-surface inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold text-white shadow-lg shadow-accent-500/25 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save changes
        </button>
      </header>

      <div className="space-y-5">
        <section className="glass space-y-4 p-5">
          <h2 className="text-sm font-bold text-violet-300">Identity</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              value={form.name}
              onChange={(v) => set('name', v)}
              required
            />
            <TextField
              label="Title"
              value={form.title}
              onChange={(v) => set('title', v)}
              required
            />
          </div>
          <TextField
            label="Headline"
            value={form.headline ?? ''}
            onChange={(v) => set('headline', v)}
            placeholder="I Build Scalable Microservices…"
          />
          <TextAreaField
            label="Bio"
            value={form.bio ?? ''}
            onChange={(v) => set('bio', v)}
            rows={4}
          />
        </section>

        <section className="glass space-y-4 p-5">
          <h2 className="text-sm font-bold text-violet-300">Files</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              label="Avatar image"
              value={form.avatarUrl}
              onChange={(url) => set('avatarUrl', url)}
              endpoint="/uploads/avatar"
              accept="image/*"
              hint="images/avatar"
            />
            <FileField
              label="Resume PDF"
              value={form.resumeUrl}
              onChange={(url, meta) => {
                set('resumeUrl', url);
                if (meta) set('resumeFileName', meta.fileName);
              }}
              endpoint="/uploads/resume"
              accept="application/pdf"
              hint="PDF only"
            />
          </div>
        </section>

        <section className="glass space-y-4 p-5">
          <h2 className="text-sm font-bold text-violet-300">Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              label="Years experience"
              value={form.yearsExperience}
              onChange={(v) => set('yearsExperience', v)}
              hint="e.g. 2.5+"
            />
            <NumberField
              label="Projects"
              value={form.projectsCompleted}
              onChange={(v) => set('projectsCompleted', v)}
            />
            <NumberField
              label="Happy clients"
              value={form.happyClients}
              onChange={(v) => set('happyClients', v)}
            />
            <NumberField
              label="Awards won"
              value={form.awardsWon}
              onChange={(v) => set('awardsWon', v)}
            />
          </div>
        </section>

        <section className="glass space-y-4 p-5">
          <h2 className="text-sm font-bold text-violet-300">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set('email', v)}
              required
            />
            <TextField
              label="Phone"
              value={form.phone ?? ''}
              onChange={(v) => set('phone', v)}
            />
          </div>
          <TextField
            label="Location"
            value={form.location ?? ''}
            onChange={(v) => set('location', v)}
          />
        </section>

        <section className="glass space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-violet-300">Social links</h2>
            <button
              type="button"
              onClick={() =>
                set('socialLinks', [
                  ...form.socialLinks,
                  { platform: '', url: '', icon: 'Linkedin' },
                ])
              }
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.7rem] font-semibold text-slate-300 hover:border-violet-accent/40 hover:text-white"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          {form.socialLinks.length === 0 && (
            <p className="text-[0.75rem] text-slate-600">No links yet.</p>
          )}

          {form.socialLinks.map((link, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-white/8 p-3 sm:grid-cols-[1fr_1.6fr_1fr_auto]"
            >
              <TextField
                label="Platform"
                value={link.platform}
                onChange={(v) => updateSocial(index, { platform: v })}
              />
              <TextField
                label="URL"
                value={link.url}
                onChange={(v) => updateSocial(index, { url: v })}
              />
              <TextField
                label="Icon"
                value={link.icon}
                onChange={(v) => updateSocial(index, { icon: v })}
                hint="Github / Linkedin"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    'socialLinks',
                    form.socialLinks.filter((_, i) => i !== index),
                  )
                }
                aria-label="Remove link"
                className="mt-6 h-9 rounded-lg border border-white/10 px-2 text-slate-400 hover:border-rose-400/50 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </section>

        <section className="glass space-y-4 p-5">
          <h2 className="text-sm font-bold text-violet-300">Availability</h2>
          <ToggleField
            label="Available for hire"
            description="Shows the sidebar CTA card on the public site."
            value={form.isAvailableForHire}
            onChange={(v) => set('isAvailableForHire', v)}
          />
          <TextField
            label="Availability note"
            value={form.availabilityNote ?? ''}
            onChange={(v) => set('availabilityNote', v)}
          />
        </section>
      </div>
    </div>
  );
}
