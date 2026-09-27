import { useId } from 'react';
import { motion } from 'motion/react';
import { Dices, Lock, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSongStore } from '@/stores/songStore';
import { useUiStore } from '@/stores/uiStore';
import { useCanEdit } from '@/stores/authStore';
import { LANGUAGE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const SEARCH_INPUT_ID = 'song-search';

interface ToolbarProps {
  languageCounts: Record<string, number>;
  totalBeforeLanguage: number;
  canShuffle: boolean;
}

export function Toolbar({ languageCounts, totalBeforeLanguage, canShuffle }: ToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <SearchBox />
        <div className="hidden gap-2 sm:flex">
          <PrimaryActions canShuffle={canShuffle} />
        </div>
      </div>
      <LanguageChips counts={languageCounts} total={totalBeforeLanguage} />

      {/* 手机端：操作按钮固定在底部，拇指够得着 */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
        <PrimaryActions canShuffle={canShuffle} stretch />
      </div>
    </div>
  );
}

function SearchBox() {
  const keyword = useSongStore((s) => s.filters.keyword);
  const setFilters = useSongStore((s) => s.setFilters);

  return (
    <label className="group relative flex h-12 flex-1 items-center rounded-2xl border border-line bg-surface shadow-soft transition-[border-color,box-shadow] focus-within:border-mint focus-within:ring-[3px] focus-within:ring-mint/25">
      <Search className="ml-4 size-[18px] shrink-0 text-fg-muted transition-colors group-focus-within:text-mint-600" />
      <input
        id={SEARCH_INPUT_ID}
        value={keyword}
        onChange={(e) => setFilters({ keyword: e.target.value })}
        placeholder="搜索歌名 / 歌手"
        autoComplete="off"
        spellCheck={false}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-fg outline-none placeholder:text-fg-muted/70"
      />
      {keyword ? (
        <button
          type="button"
          onClick={() => {
            setFilters({ keyword: '' });
            document.getElementById(SEARCH_INPUT_ID)?.focus();
          }}
          className="mr-2 flex size-8 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
          aria-label="清空搜索"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="mr-4 hidden h-6 min-w-6 items-center justify-center rounded-md border border-line bg-subtle px-1.5 font-sans text-xs text-fg-muted pointer-fine:flex">
          /
        </kbd>
      )}
    </label>
  );
}

function PrimaryActions({ canShuffle, stretch }: { canShuffle: boolean; stretch?: boolean }) {
  const openDialog = useUiStore((s) => s.openDialog);
  const canEdit = useCanEdit();

  return (
    <>
      <Button
        variant="peach"
        size="lg"
        onClick={() => openDialog({ type: 'lucky' })}
        disabled={!canShuffle}
        className={cn('rounded-2xl shadow-lg shadow-peach/25', stretch && 'flex-1')}
      >
        <Dices />
        手气不错
      </Button>
      {canEdit ? (
        <Button
          size="lg"
          onClick={() => openDialog({ type: 'add' })}
          className={cn('rounded-2xl shadow-lg shadow-mint/25', stretch && 'flex-1')}
        >
          <Plus />
          添加歌曲
        </Button>
      ) : (
        <Button
          variant="outline"
          size="lg"
          onClick={() => openDialog({ type: 'unlock' })}
          className={cn('rounded-2xl text-fg-muted', stretch && 'flex-1')}
        >
          <Lock />
          解锁编辑
        </Button>
      )}
    </>
  );
}

function LanguageChips({ counts, total }: { counts: Record<string, number>; total: number }) {
  const language = useSongStore((s) => s.filters.language);
  const setFilters = useSongStore((s) => s.setFilters);
  const id = useId();

  // 只显示当前结果里出现过的语言；已选中的即使数量为 0 也保留，方便切回
  const options = [
    { value: '', label: '全部', count: total },
    ...LANGUAGE_OPTIONS.filter((lang) => counts[lang] || lang === language).map((lang) => ({
      value: lang,
      label: lang,
      count: counts[lang] ?? 0,
    })),
  ];

  return (
    <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((option) => {
        const active = option.value === language;
        return (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => setFilters({ language: option.value })}
            className={cn(
              'relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors',
              active ? 'font-medium text-ink' : 'text-fg-muted hover:bg-subtle hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`lang-chip-${id}`}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-full bg-mint"
              />
            )}
            <span className="relative">{option.label}</span>
            <span className={cn('relative text-xs tabular-nums', active ? 'text-ink/60' : 'text-fg-muted/70')}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
