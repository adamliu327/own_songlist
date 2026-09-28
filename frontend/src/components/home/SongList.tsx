import { useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Music, Plus, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongRow } from './SongRow';
import { useUiStore } from '@/stores/uiStore';
import { useSongStore } from '@/stores/songStore';
import { useCanEdit } from '@/stores/authStore';
import { useDanmakuCopy } from '@/hooks/useDanmakuCopy';
import type { Song } from '@/types';

// 歌多时关掉重排动画，避免筛选时卡顿
const ANIMATE_LIMIT = 150;

interface SongListProps {
  songs: Song[];
  isLoading: boolean;
  hasSongs: boolean;
}

export function SongList({ songs, isLoading, hasSongs }: SongListProps) {
  const keyword = useSongStore((s) => s.filters.keyword);
  const copiedId = useUiStore((s) => s.copiedId);
  const openDialog = useUiStore((s) => s.openDialog);
  const canEdit = useCanEdit();
  const copy = useDanmakuCopy();

  const flashCopied = useUiStore((s) => s.flashCopied);
  const handleCopy = useCallback(
    async (song: Song) => {
      if (await copy(song)) flashCopied(song.id);
    },
    [copy, flashCopied],
  );
  const handleEdit = useCallback((song: Song) => openDialog({ type: 'edit', song }), [openDialog]);
  const handleDelete = useCallback((song: Song) => openDialog({ type: 'delete', song }), [openDialog]);

  if (isLoading && !hasSongs) return <ListSkeleton />;
  if (!hasSongs) return <EmptyLibrary canEdit={canEdit} />;
  if (songs.length === 0) return <NoMatch />;

  const animate = songs.length <= ANIMATE_LIMIT;

  return (
    <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      <AnimatePresence initial={false}>
        {songs.map((song) => (
          <SongRow
            key={song.id}
            song={song}
            keyword={keyword}
            copied={copiedId === song.id}
            canEdit={canEdit}
            animate={animate}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <div className="size-12 animate-pulse rounded-xl bg-subtle" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded-full bg-subtle" />
            <div className="h-3 w-1/4 animate-pulse rounded-full bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, children }: { icon: typeof Music; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line px-6 py-16 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-pink-light dark:bg-subtle">
        <Icon className="size-7 text-pink-400" />
      </div>
      <p className="font-display text-lg font-bold text-fg">{title}</p>
      {children}
    </motion.div>
  );
}

function EmptyLibrary({ canEdit }: { canEdit: boolean }) {
  const openDialog = useUiStore((s) => s.openDialog);
  return (
    <EmptyState icon={Music} title="还没有歌曲">
      <p className="mt-1 text-sm text-fg-muted">搜索网易云、手动录入，或者从歌单一次导入</p>
      {canEdit && (
        <Button className="mt-5" onClick={() => openDialog({ type: 'add' })}>
          <Plus />
          添加第一首歌
        </Button>
      )}
    </EmptyState>
  );
}

function NoMatch() {
  const setFilters = useSongStore((s) => s.setFilters);
  return (
    <EmptyState icon={SearchX} title="没有匹配的歌曲">
      <p className="mt-1 text-sm text-fg-muted">换个关键词，或者清除语言筛选试试</p>
      <Button variant="outline" className="mt-5" onClick={() => setFilters({ keyword: '', language: '' })}>
        清除筛选
      </Button>
    </EmptyState>
  );
}
