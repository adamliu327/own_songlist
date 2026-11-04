import type { ReactNode } from 'react';
import { Button, Title } from 'animal-island-ui';
import { ListIcon, LockIcon, LockOpenIcon, MicIcon, SettingsIcon } from 'naive-icons';
import { lock, needsUnlock, openDialog, useCanEdit, useStore, type Dialog } from '@/store';

export function Header() {
  const playlistName = useStore((s) => s.config.playlist_name);
  const total = useStore((s) => s.songs.length);
  const canEdit = useCanEdit();

  return (
    <header className="header">
      <div className="brand">
        <Title size="large" color="app-teal">
          {playlistName}
        </Title>
        <p className="muted">收录 {total} 首</p>
      </div>

      <nav className="header-actions">
        <HeaderButton icon={<MicIcon size={16} color="currentColor" />} label="下载歌词" dialog={{ type: 'lyric' }} />
        <HeaderButton icon={<ListIcon size={16} color="currentColor" />} label="对比歌单" dialog={{ type: 'compare' }} />
        {canEdit && <HeaderButton icon={<SettingsIcon size={16} color="currentColor" />} label="设置" dialog={{ type: 'settings' }} />}
        {needsUnlock &&
          (canEdit ? (
            <Button type="text" size="small" icon={<LockOpenIcon size={16} color="currentColor" />} onClick={lock} aria-label="锁定编辑" title="已解锁，点击锁定">
              <span className="btn-label">锁定</span>
            </Button>
          ) : (
            <HeaderButton icon={<LockIcon size={16} color="currentColor" />} label="解锁" dialog={{ type: 'unlock' }} />
          ))}
      </nav>
    </header>
  );
}

/** 次要的工具入口，用小号按钮，不跟主操作抢视线；窄屏只显示图标 */
function HeaderButton({ icon, label, dialog }: { icon: ReactNode; label: string; dialog: Dialog }) {
  return (
    <Button type="text" size="small" icon={icon} onClick={() => openDialog(dialog)} aria-label={label} title={label}>
      <span className="btn-label">{label}</span>
    </Button>
  );
}
