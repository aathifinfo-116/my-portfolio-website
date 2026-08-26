/** Shared display formatters. */

/** Renders "2.4 MB" / "480 KB" from a byte count. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';

  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;

  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

/** Renders "Mar 2024" from an ISO timestamp. */
export function formatUploadDate(iso: string | null | undefined): string {
  if (!iso) return '—';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}
