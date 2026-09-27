import { memo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { SongCover } from '@/components/common/SongCover';
import { LangBadge } from '@/components/common/LangBadge';
import { Highlight } from '@/components/common/Highlight';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

interface SongRowProps {
  song: Song;
  index: number;
  keyword: string;
  active: boolean;
  /** 刚复制的弹幕文本，非空时显示复制反馈 */
  copiedText: string | null;
  canEdit: boolean;
  animate: boolean;
  onCopy: (song: Song, index: number) => void;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
}

export const SongRow = memo(function SongRow({
  song,
  index,
  keyword,
  active,
  copiedText,
  canEdit,
  animate,
  onCopy,
  onEdit,
  onDelete,
}: SongRowProps) {
  const ref = useRef<HTMLLIElement>(null);
  const copied = copiedText !== null;

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [active]);

  return (
    <motion.li
      ref={ref}
      layout={animate ? 'position' : false}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.8 }}
      className="scroll-my-24"
    >
      <div
        role="button"
        tabIndex={-1}
        onClick={() => onCopy(song, index)}
        title="点击复制点歌弹幕"
        className={cn(
          'group relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-2.5 pr-3 transition-[background-color,border-color,box-shadow] duration-200 select-none sm:p-3',
          copied
            ? 'border-mint/60 bg-mint-light/60 dark:bg-mint/10'
            : 'border-line hover:border-mint/50 hover:shadow-soft',
          active && !copied && 'border-mint ring-[3px] ring-mint/25',
        )}
      >
        <SongCover src={song.cover} alt={song.name} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-fg">
              <Highlight text={song.name} keyword={keyword} />
            </p>
            {song.language && <LangBadge language={song.language} />}
          </div>
          {copied ? (
            <p className="mt-0.5 truncate text-sm font-medium text-mint-700 dark:text-mint">
              已复制「{copiedText}」
            </p>
          ) : (
            <p className="mt-0.5 truncate text-sm text-fg-muted">
              {song.singer ? <Highlight text={song.singer} keyword={keyword} /> : '未知歌手'}
              {song.remark && <span className="text-fg-muted/70"> · {song.remark}</span>}
            </p>
          )}
        </div>

        {canEdit && (
          <div
            className="flex shrink-0 items-center gap-0.5 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onEdit(song)}
              aria-label="编辑"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-mint/15 hover:text-mint-700 dark:hover:text-mint"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(song)}
              aria-label="删除"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-peach/15 hover:text-peach-700 dark:hover:text-peach"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}

        <CopyIndicator copied={copied} />
      </div>
    </motion.li>
  );
});

function CopyIndicator({ copied }: { copied: boolean }) {
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
        copied
          ? 'scale-110 bg-mint text-ink'
          : 'bg-peach/12 text-peach-600 group-hover:bg-peach group-hover:text-white dark:text-peach dark:group-hover:text-white',
      )}
    >
      <motion.span
        key={copied ? 'check' : 'copy'}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 28 }}
      >
        {copied ? <Check className="size-[18px]" strokeWidth={2.5} /> : <Copy className="size-4" />}
      </motion.span>
    </div>
  );
}
