import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '@/components/ui/Toast';

export function LoginPage() {
  const { login, isAuthenticated, isRestoring } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where the user was heading before the guard bounced them here.
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    '/admin';

  if (!isRestoring && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      notify('success', 'Signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed.';
      setError(message);
      notify('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-ink-950 px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-accent-600/12 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[24rem] w-[24rem] rounded-full bg-violet-accent/12 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-violet-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portfolio
        </Link>

        <form onSubmit={handleSubmit} className="glass p-6">
          <div className="gradient-surface mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl">
            <Lock className="h-5 w-5 text-white" />
          </div>

          <h1 className="mb-1 text-lg font-bold">Admin sign in</h1>
          <p className="mb-6 text-[0.78rem] text-slate-500">
            Manage the content shown on your portfolio.
          </p>

          <div className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-slate-400">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-violet-accent/60"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-slate-400">
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-violet-accent/60"
                />
              </div>
            </label>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[0.72rem] text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="gradient-surface mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
