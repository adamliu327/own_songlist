import { useState, useEffect } from 'react';
import { Plus, Lock, Dices, GitCompare, X } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { SongFilters } from '@/components/SongFilters';
import { SongList } from '@/components/SongList';
import { AddSongDialog } from '@/components/AddSongDialog';
import { EditSongDialog } from '@/components/EditSongDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { CompareDialog } from '@/components/CompareDialog';
import { UnlockDialog } from '@/components/UnlockDialog';
import { useSongs } from '@/hooks/useSongs';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore, requiresUnlock } from '@/stores/authStore';
import { LuckyDialog } from '@/components/LuckyDialog';
import type { Song } from '@/types';

function App() {
  const {
    songs,
    filteredSongs,
    filters,
    overlap,
    isLoading,
    addSong,
    updateSong,
    deleteSong,
    setFilters,
    setOverlapMode,
    clearOverlap,
  } = useSongs();

  const { config, loadConfig } = useConfigStore();
  const { isUnlocked } = useAuthStore();
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [luckySong, setLuckySong] = useState<Song | null>(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (config.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(config.theme);
    }
  }, [config.theme]);

  useEffect(() => {
    document.title = config.playlistName;
  }, [config.playlistName]);

  const handleDelete = async (song: Song) => {
    if (confirm(`确定要删除「${song.name}」吗？`)) {
      await deleteSong(song.id);
    }
  };

  const canEdit = !requiresUnlock || isUnlocked;

  const matchedSet = overlap ? new Set(overlap.matchedIds) : null;
  const overlapCount = matchedSet ? songs.filter((s) => matchedSet.has(s.id)).length : 0;
  const localOnlyCount = matchedSet ? songs.length - overlapCount : 0;

  const handleLucky = () => {
    if (filteredSongs.length === 0) return;
    const pick = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
    setLuckySong(pick);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenCompare={() => setCompareOpen(true)}
        onUnlock={() => setUnlockOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6">
        <section className="mb-6">
          <SongFilters filters={filters} onChange={setFilters} />
        </section>

        {overlap && (
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-mint/40 bg-mint/10 px-4 py-2.5 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <GitCompare className="h-4 w-4 shrink-0 text-mint-600" />
              <span className="min-w-0 truncate text-ink">
                对比「<span className="font-semibold">{overlap.title}</span>」
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
              <button
                onClick={() => setOverlapMode('overlap')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  overlap.mode === 'overlap'
                    ? 'bg-mint text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                重合 {overlapCount}
              </button>
              <button
                onClick={() => setOverlapMode('localOnly')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  overlap.mode === 'localOnly'
                    ? 'bg-mint text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                我有 ta 没有 {localOnlyCount}
              </button>
            </div>

            <button
              onClick={clearOverlap}
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-white/70 hover:text-ink"
            >
              清除
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-ink-muted">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                加载中...
              </span>
            ) : (
              `共 ${filteredSongs.length} 首歌曲`
            )}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              onClick={handleLucky}
              disabled={filteredSongs.length === 0 || isLoading}
              className="h-11 gap-2 rounded-full bg-peach px-6 font-display font-bold text-white shadow-lg shadow-peach/30 transition-all hover:-translate-y-0.5 hover:bg-peach/90 hover:shadow-xl hover:shadow-peach/40 disabled:pointer-events-none disabled:opacity-40"
            >
              <Dices className="h-5 w-5" />
              手气不错
            </Button>
            {canEdit ? (
              <Button
                onClick={() => setAddOpen(true)}
                className="h-11 gap-2 rounded-full bg-mint px-6 font-display font-bold text-ink shadow-lg shadow-mint/30 transition-all hover:-translate-y-0.5 hover:bg-mint/90 hover:shadow-xl hover:shadow-mint/40"
              >
                <Plus className="h-5 w-5" />
                添加歌曲
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setUnlockOpen(true)}
                className="h-11 gap-2 rounded-full border-pink/60 bg-white px-6 text-ink-muted shadow-soft hover:bg-pink-light/50 hover:text-ink"
              >
                <Lock className="h-5 w-5" />
                已锁定
              </Button>
            )}
          </div>
        </div>

        <SongList
          songs={filteredSongs}
          onEdit={setEditingSong}
          onDelete={handleDelete}
        />
      </main>

      <AddSongDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addSong} />

      <EditSongDialog
        song={editingSong}
        open={!!editingSong}
        onOpenChange={(open) => {
          if (!open) setEditingSong(null);
        }}
        onSave={updateSong}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <CompareDialog open={compareOpen} onOpenChange={setCompareOpen} />

      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />

      <LuckyDialog
        song={luckySong}
        open={!!luckySong}
        onOpenChange={(open) => {
          if (!open) setLuckySong(null);
        }}
        onShuffle={handleLucky}
      />

      <Toaster
        position="top-center"
        toastOptions={{
          className: 'rounded-2xl border-pink/40 bg-white font-sans',
        }}
      />
    </div>
  );
}

export default App;
