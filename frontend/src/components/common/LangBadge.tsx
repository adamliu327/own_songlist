import { LANG_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function LangBadge({ language, className }: { language: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium',
        LANG_STYLES[language] ?? LANG_STYLES['其他'],
        className,
      )}
    >
      {language}
    </span>
  );
}
