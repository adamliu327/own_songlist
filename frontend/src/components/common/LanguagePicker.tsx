import { LANGUAGE_OPTIONS, LANG_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface LanguagePickerProps {
  value: string;
  onChange: (language: string) => void;
  /** 「不选」这一项的文案 */
  emptyLabel?: string;
  className?: string;
}

/** 表单里选语言：一排标签，单选，空字符串表示不填 */
export function LanguagePicker({ value, onChange, emptyLabel = '不填', className }: LanguagePickerProps) {
  const options = ['', ...LANGUAGE_OPTIONS];
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((lang) => {
        const active = value === lang;
        return (
          <button
            key={lang || 'none'}
            type="button"
            onClick={() => onChange(lang)}
            className={cn(
              'h-8 cursor-pointer rounded-full border px-3 text-sm transition-all active:scale-95',
              active
                ? cn('border-transparent font-medium', lang ? LANG_STYLES[lang] : 'bg-track text-fg')
                : 'border-line text-fg-muted hover:border-mint/60 hover:text-fg',
            )}
          >
            {lang || emptyLabel}
          </button>
        );
      })}
    </div>
  );
}
