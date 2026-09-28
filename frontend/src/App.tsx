import { useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { AppHeader } from '@/components/home/AppHeader';
import { Toolbar } from '@/components/home/Toolbar';
import { OverlapBanner } from '@/components/home/OverlapBanner';
import { SongList } from '@/components/home/SongList';
import { AddSongDialog } from '@/components/dialogs/AddSongDialog';
import { EditSongDialog } from '@/components/dialogs/EditSongDialog';
import { DeleteSongDialog } from '@/components/dialogs/DeleteSongDialog';
import { LuckyDialog } from '@/components/dialogs/LuckyDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { CompareDialog } from '@/components/dialogs/CompareDialog';
import { LyricDownloadDialog } from '@/components/dialogs/LyricDownloadDialog';
import { UnlockDialog } from '@/components/dialogs/UnlockDialog';
import { useVisibleSongs } from '@/hooks/useVisibleSongs';
import { useListHotkeys } from '@/hooks/useListHotkeys';
import { useSongStore } from '@/stores/songStore';
import { useConfigStore } from '@/stores/configStore';
import { applyTheme, watchSystemTheme } from '@/lib/theme';

function App() {
  const songs = useSongStore((s) => s.songs);
  const isLoading = useSongStore((s) => s.isLoading);
  const filters = useSongStore((s) => s.filters);
  const overlap = useSongStore((s) => s.overlap);
  const config = useConfigStore((s) => s.config);
  const { visible, languageCounts, totalBeforeLanguage, overlapCount, localOnlyCount } = useVisibleSongs();

  useListHotkeys(visible);

  useEffect(() => {
    useSongStore.getState().loadSongs();
    useConfigStore
      .getState()
      .loadConfig()
      .then(() => {
        const language = useConfigStore.getState().config.defaultLanguageFilter;
        if (language) useSongStore.getState().setFilters({ language });
      });
  }, []);

  useEffect(() => {
    applyTheme(config.theme);
    if (config.theme === 'system') return watchSystemTheme(() => applyTheme('system'));
  }, [config.theme]);

  useEffect(() => {
    document.title = config.playlistName;
  }, [config.playlistName]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-dvh">
        {/* 页面顶部的柔和渐变，向下淡出 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-r from-mint/25 via-pink/30 to-peach/25 [mask-image:linear-gradient(to_bottom,black_40%,transparent)] dark:from-mint/10 dark:via-pink/5 dark:to-peach/10" />
        <AppHeader total={songs.length} />

        <main className="mx-auto w-full max-w-6xl px-4 pt-2 pb-32 sm:px-6 sm:pb-16">
          <Toolbar
            languageCounts={languageCounts}
            totalBeforeLanguage={totalBeforeLanguage}
            canShuffle={visible.length > 0}
          />

          <AnimatePresence>
            {overlap && (
              <OverlapBanner overlap={overlap} overlapCount={overlapCount} localOnlyCount={localOnlyCount} />
            )}
          </AnimatePresence>

          <p className="mt-5 mb-3 text-sm text-fg-muted">
            {filters.keyword || filters.language || overlap ? `找到 ${visible.length} 首` : `共 ${songs.length} 首`}
          </p>

          <SongList songs={visible} isLoading={isLoading} hasSongs={songs.length > 0} />
        </main>

        <AddSongDialog />
        <EditSongDialog />
        <DeleteSongDialog />
        <LuckyDialog pool={visible} />
        <SettingsDialog />
        <CompareDialog />
        <LyricDownloadDialog />
        <UnlockDialog />

        <Toaster theme={config.theme} position="top-center" />
      </div>
    </MotionConfig>
  );
}

export default App;
