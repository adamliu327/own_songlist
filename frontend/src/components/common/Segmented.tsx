import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}

/** 分段切换，选中底块在选项间滑动 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  const id = useId();

  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 rounded-2xl bg-track p-1',
        size === 'sm' && 'rounded-full',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors [&_svg]:size-4',
              size === 'md' ? 'h-10 rounded-xl px-3 text-sm' : 'h-7 rounded-full px-3 text-xs',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className={cn(
                  'absolute inset-0 bg-surface shadow-sm',
                  size === 'md' ? 'rounded-xl' : 'rounded-full',
                )}
              />
            )}
            <span className="relative flex items-center gap-1.5">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
