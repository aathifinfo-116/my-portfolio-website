import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Briefcase,
  FolderOpen,
  GraduationCap,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAdminAuth } from '../context/AdminAuthContext';

interface Counts {
  services: number;
  projects: number;
  certifications: number;
  documents: number;
  awards: number;
  unreadInquiries: number;
}

const CARDS = [
  { key: 'projects', label: 'Projects', to: '/admin/projects', icon: Briefcase },
  { key: 'services', label: 'Services', to: '/admin/services', icon: Sparkles },
  {
    key: 'certifications',
    label: 'Studies & Certs',
    to: '/admin/certifications',
    icon: GraduationCap,
  },
  { key: 'documents', label: 'Documents', to: '/admin/documents', icon: FolderOpen },
  { key: 'awards', label: 'Awards', to: '/admin/awards', icon: Award },
] as const;

/** Reads counts straight off the list endpoints — no dedicated stats API. */
export function DashboardPage() {
  const { user } = useAdminAuth();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    const size = (data: unknown): number => {
      if (Array.isArray(data)) return data.length;
      if (data && typeof data === 'object' && 'total' in data) {
        return (data as { total: number }).total;
      }
      return 0;
    };

    Promise.all([
      apiClient.get('/services/admin/all'),
      apiClient.get('/projects/admin/all', { params: { limit: 200 } }),
      apiClient.get('/certifications/admin/all', { params: { limit: 200 } }),
      apiClient.get('/documents/admin/all', { params: { limit: 200 } }),
      apiClient.get('/awards/admin/all'),
      apiClient.get('/contact/stats'),
    ])
      .then(([services, projects, certs, documents, awards, inbox]) => {
        setCounts({
          services: size(services.data),
          projects: size(projects.data),
          certifications: size(certs.data),
          documents: size(documents.data),
          awards: size(awards.data),
          unreadInquiries: (inbox.data as { unread: number }).unread ?? 0,
        });
      })
      .catch(() => setCounts(null));
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
        </h1>
        <p className="mt-1 text-[0.8rem] text-slate-500">
          Everything published on your portfolio is managed from here.
        </p>
      </header>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ key, label, to, icon: Icon }) => (
          <Link
            key={key}
            to={to}
            className="glass glass-hover group flex items-center gap-4 p-5"
          >
            <span className="gradient-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5 text-white" />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-white">
                {counts ? counts[key] : '—'}
              </span>
              <span className="block text-[0.72rem] text-slate-500">{label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="glass flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
          <Inbox className="h-5 w-5 text-violet-accent" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {counts ? counts.unreadInquiries : '—'} unread{' '}
            {counts?.unreadInquiries === 1 ? 'inquiry' : 'inquiries'}
          </p>
          <p className="text-[0.72rem] text-slate-500">
            Contact form submissions are stored in the database and readable via
            the API.
          </p>
        </div>
      </div>
    </div>
  );
}
