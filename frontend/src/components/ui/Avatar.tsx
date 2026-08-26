import { useEffect, useState } from 'react';
import { resolveFileUrl } from '@/lib/apiClient';
import { cn } from './Primitives';

interface AvatarProps {
  /** Raw value from the profile API; may be relative, absolute, or null. */
  src: string | null | undefined;
  /** Used for the alt text and the initials fallback. */
  name: string | null | undefined;
  className?: string;
  /** Tailwind text size for the initials fallback. */
  initialsClassName?: string;
  /** True while the profile request is still in flight. */
  isLoading?: boolean;
  /**
   * Gradient fill behind the image. Off for the borderless hero portrait,
   * where the image should sit directly on the card.
   */
  showBackdrop?: boolean;
  /** Extra classes on the <img> itself — object-position, masks, filters. */
  imageClassName?: string;
}

function initialsFrom(name: string | null | undefined): string {
  const source = name?.trim() || 'Aathif Thahir';
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Profile image with three distinct states: skeleton while the profile request
 * is in flight, the image once it decodes, and gradient initials if there is no
 * URL or the file fails to load. The initials render underneath rather than
 * replacing the image, so a broken src degrades without a layout shift.
 */
export function Avatar({
  src,
  name,
  className,
  initialsClassName = 'text-base',
  isLoading = false,
  showBackdrop = true,
  imageClassName,
}: AvatarProps) {
  const resolved = resolveFileUrl(src);
  const [status, setStatus] = useState<'idle' | 'loaded' | 'failed'>('idle');

  // A changed src must re-enter the loading state, or a previous failure
  // would suppress the new image.
  useEffect(() => {
    setStatus('idle');
  }, [resolved]);

  const showSkeleton = isLoading && !resolved;
  const showImage = Boolean(resolved) && status !== 'failed';

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        showBackdrop && 'bg-gradient-to-br from-accent-500 to-violet-accent',
        className,
      )}
    >
      {showSkeleton ? (
        <div className="h-full w-full animate-pulse bg-white/10" />
      ) : (
        <>
          {/* Fallback layer, covered by the image once it loads. */}
          <span
            aria-hidden={showImage && status === 'loaded'}
            className={cn(
              'absolute inset-0 flex items-center justify-center font-bold text-white',
              initialsClassName,
            )}
          >
            {initialsFrom(name)}
          </span>

          {showImage && (
            <img
              src={resolved ?? undefined}
              alt={name ?? 'Profile'}
              loading="lazy"
              decoding="async"
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('failed')}
              className={cn(
                'relative h-full w-full object-cover transition-opacity duration-300',
                status === 'loaded' ? 'opacity-100' : 'opacity-0',
                imageClassName,
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
