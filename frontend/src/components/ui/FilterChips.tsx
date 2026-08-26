import { motion } from 'framer-motion';
import { cn } from './Primitives';

interface FilterChipsProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
  /** Optional per-option counts, keyed by option value. */
  counts?: Partial<Record<string, number>>;
  /** Must be unique per row — drives the sliding pill animation. */
  layoutId: string;
  label: string;
  /** Secondary rows render smaller, to establish visual hierarchy. */
  size?: 'default' | 'compact';
  /** Maps an option value to its display text. */
  renderLabel?: (value: T) => string;
}

export function FilterChips<T extends string>({
  options,
  active,
  onChange,
  counts,
  layoutId,
  label,
  size = 'default',
  renderLabel,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = active === option;
        const count = counts?.[option];
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={cn(
              'relative rounded-full font-semibold transition-colors duration-200',
              size === 'compact'
                ? 'px-3 py-1.5 text-[0.68rem]'
                : 'px-4 py-2 text-xs',
              isActive
                ? 'text-white'
                : 'border border-white/10 text-slate-400 hover:border-violet-accent/40 hover:text-white',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className={cn(
                  'absolute inset-0 rounded-full',
                  size === 'compact'
                    ? 'bg-white/12 ring-1 ring-violet-accent/40'
                    : 'gradient-surface',
                )}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">
              {renderLabel ? renderLabel(option) : option}
              {typeof count === 'number' && count > 0 && (
                <span
                  className={cn(
                    'ml-1.5',
                    isActive ? 'text-white/70' : 'text-slate-600',
                  )}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
