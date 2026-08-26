import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './Primitives';

interface PaginatedGridProps<T> {
  items: T[];
  /** Items per page. */
  pageSize?: number;
  renderItem: (item: T, indexOnPage: number) => ReactNode;
  keyOf: (item: T) => string;
  /** Tailwind grid classes for the card layout. */
  gridClassName?: string;
  /**
   * Change this when the filter changes so the view returns to page 1 —
   * otherwise a narrower result set can leave you on an empty page.
   */
  resetKey?: string;
  /** Announced to screen readers, e.g. "documents". */
  itemNoun?: string;
}

const SLIDE_DISTANCE = 24;

/**
 * Card grid with page controls and a direction-aware slide transition.
 *
 * `mode="wait"` animates one page out before the next comes in, so the two
 * never occupy the flow simultaneously — that is what keeps the surrounding
 * layout from jumping mid-transition.
 */
export function PaginatedGrid<T>({
  items,
  pageSize = 6,
  renderItem,
  keyOf,
  gridClassName = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3',
  resetKey,
  itemNoun = 'items',
}: PaginatedGridProps<T>) {
  const [page, setPage] = useState(1);
  // +1 when moving forward, -1 back; drives which side the pages slide from.
  const [direction, setDirection] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Return to page 1 whenever the filter changes.
  useEffect(() => {
    setPage(1);
    setDirection(1);
  }, [resetKey]);

  // Guard against the item count shrinking below the current page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const goTo = (next: number) => {
    if (next === page || next < 1 || next > totalPages) return;
    setDirection(next > page ? 1 : -1);
    setPage(next);
  };

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, items.length);

  return (
    <div>
      {/* overflow-hidden clips the slide so it never widens the page */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ opacity: 0, x: direction * SLIDE_DISTANCE }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -SLIDE_DISTANCE }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={gridClassName}
          >
            {visible.map((item, index) => (
              <div key={keyOf(item)}>{renderItem(item, index)}</div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <nav
          aria-label={`${itemNoun} pagination`}
          className="mt-7 flex flex-wrap items-center justify-between gap-4"
        >
          <p aria-live="polite" className="text-[0.72rem] text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-300">
              {rangeStart}–{rangeEnd}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-300">{items.length}</span>{' '}
            {itemNoun}
          </p>

          <div className="flex items-center gap-1.5">
            <PageArrow
              direction="previous"
              disabled={page === 1}
              onClick={() => goTo(page - 1)}
            />

            <div className="flex items-center gap-1">
              {buildPageList(page, totalPages).map((entry, index) =>
                entry === 'gap' ? (
                  <span
                    key={`gap-${index}`}
                    aria-hidden
                    className="px-1 text-xs text-slate-600"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => goTo(entry)}
                    aria-label={`Page ${entry}`}
                    aria-current={entry === page ? 'page' : undefined}
                    className={cn(
                      'relative h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-colors',
                      entry === page
                        ? 'text-white'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                    )}
                  >
                    {entry === page && (
                      <motion.span
                        layoutId={`page-pill-${itemNoun}`}
                        className="gradient-surface absolute inset-0 rounded-lg"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    <span className="relative">{entry}</span>
                  </button>
                ),
              )}
            </div>

            <PageArrow
              direction="next"
              disabled={page === totalPages}
              onClick={() => goTo(page + 1)}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function PageArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} page`}
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5',
        'text-xs font-semibold transition-colors',
        disabled
          ? 'cursor-not-allowed text-slate-700'
          : 'text-slate-300 hover:border-violet-accent/40 hover:text-white',
      )}
    >
      {direction === 'previous' && <Icon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">
        {direction === 'previous' ? 'Previous' : 'Next'}
      </span>
      {direction === 'next' && <Icon className="h-3.5 w-3.5" />}
    </button>
  );
}

/**
 * Windowed page numbers: always the first and last, the current and its
 * neighbours, with ellipses standing in for the rest.
 */
function buildPageList(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < totalPages) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | 'gap'> = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push('gap');
    result.push(value);
  });

  return result;
}
