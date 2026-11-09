import { useEffect } from 'react';
import { BackTop, Cursor } from 'animal-island-ui';
import { CompareBar } from '@/components/CompareBar';
import { Header } from '@/components/Header';
import { SongList } from '@/components/SongList';
import { MobileActions, Toolbar } from '@/components/Toolbar';
import { AddSongDrawer } from '@/components/dialogs/AddSongDrawer';
import { CompareModal } from '@/components/dialogs/CompareModal';
import { LuckyModal } from '@/components/dialogs/LuckyModal';
import { LyricDrawer } from '@/components/dialogs/LyricDrawer';
import { SettingsDrawer } from '@/components/dialogs/SettingsDrawer';
import { DeleteSongModal, EditSongModal, UnlockModal } from '@/components/dialogs/SongModals';
import { useHotkeys, useVisibleSongs } from '@/hooks';
import { init, useStore } from '@/store';

export default function App() {
  const total = useStore((s) => s.songs.length);
  const filtered = useStore((s) => !!(s.keyword.trim() || s.language || s.overlap));
  const overlap = useStore((s) => s.overlap);
  const playlistName = useStore((s) => s.config.playlist_name);
  const dialog = useStore((s) => s.dialog);
  const { visible, languageCounts, totalBeforeLanguage } = useVisibleSongs();

  useHotkeys(visible);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    document.title = playlistName;
  }, [playlistName]);

  return (
    <Cursor>
      <div className="page">
        <Header />
        <main>
          <Toolbar
            languageCounts={languageCounts}
            totalBeforeLanguage={totalBeforeLanguage}
            canShuffle={visible.length > 0}
          />
          {overlap && <CompareBar overlap={overlap} />}
          <p className="list-count muted">{filtered ? `找到 ${visible.length} 首` : `共 ${total} 首`}</p>
          <SongList songs={visible} />
        </main>
        <MobileActions canShuffle={visible.length > 0} />
        <BackTop />
      </div>

      {/* 抽屉常驻，开关有滑入滑出动画；弹窗关闭即卸载，下次打开是新的状态 */}
      <AddSongDrawer open={dialog?.type === 'add'} />
      <LyricDrawer open={dialog?.type === 'lyric'} />
      <SettingsDrawer open={dialog?.type === 'settings'} />
      {dialog?.type === 'edit' && <EditSongModal song={dialog.song} />}
      {dialog?.type === 'delete' && <DeleteSongModal song={dialog.song} />}
      {dialog?.type === 'lucky' && <LuckyModal pool={visible} />}
      {dialog?.type === 'compare' && <CompareModal />}
      {dialog?.type === 'unlock' && <UnlockModal />}
    </Cursor>
  );
}
