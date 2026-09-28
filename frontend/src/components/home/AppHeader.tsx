import { useEffect, useState } from 'react';
import { DropdownMenu } from 'radix-ui';
import {
  FileMusic,
  GitCompare,
  Lock,
  LockOpen,
  MoreHorizontal,
  Music,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore, requiresUnlock, useCanEdit } from '@/stores/authStore';
import { useUiStore, type DialogState } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface HeaderAction {
  label: string;
  icon: LucideIcon;
  dialog: DialogState;
}

export function AppHeader({ total }: { total: number }) {
  const playlistName = useConfigStore((s) => s.config.playlistName);
  const { isUnlocked, lock } = useAuthStore();
  const canEdit = useCanEdit();
  const openDialog = useUiStore((s) => s.openDialog);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const actions: HeaderAction[] = [
    { label: '下载歌词', icon: FileMusic, dialog: { type: 'lyric' } },
    { label: '对比歌单', icon: GitCompare, dialog: { type: 'compare' } },
    ...(canEdit ? [{ label: '设置', icon: Settings, dialog: { type: 'settings' } } as HeaderAction] : []),
  ];

  return (
    <>
    {/* 顶栏 fixed 定位，收缩时不影响文档流；这里按展开高度占位 */}
    <div aria-hidden className="h-24 sm:h-32" />
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 transition-[padding,background-color,box-shadow] duration-300',
        compact
          ? 'bg-background/80 py-2.5 shadow-[0_1px_0_var(--border)] backdrop-blur-xl'
          : 'bg-transparent py-5 sm:py-8',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 transition-[height] duration-300 sm:px-6',
          compact ? 'h-10' : 'h-14 sm:h-16',
        )}
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-2xl bg-surface shadow-soft transition-all duration-300',
              compact ? 'size-9 rounded-xl' : 'size-12 sm:size-14',
            )}
          >
            <Music className={cn('text-mint-600 transition-all', compact ? 'size-5' : 'size-6 sm:size-7')} />
          </div>
          <div className="min-w-0">
            <h1
              className={cn(
                'truncate font-display font-black tracking-tight text-fg transition-all duration-300',
                compact ? 'text-lg' : 'text-2xl sm:text-3xl',
              )}
            >
              {playlistName}
            </h1>
            <p
              className={cn(
                'text-sm text-fg-muted transition-all duration-300',
                compact ? 'h-0 opacity-0' : 'mt-0.5 h-5 opacity-100',
              )}
            >
              收录 {total} 首
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {requiresUnlock && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isUnlocked ? lock : () => openDialog({ type: 'unlock' })}
              title={isUnlocked ? '已解锁，点击锁定' : '已锁定，点击解锁'}
              className={cn(isUnlocked && 'text-mint-600')}
            >
              {isUnlocked ? <LockOpen className="size-5" /> : <Lock className="size-5" />}
            </Button>
          )}

          {/* 桌面端：图标 + 文字 */}
          <div className="hidden items-center gap-1 sm:flex">
            {actions.map(({ label, icon: Icon, dialog }) => (
              <Button key={label} variant="ghost" onClick={() => openDialog(dialog)}>
                <Icon />
                {label}
              </Button>
            ))}
          </div>

          {/* 手机端：收进更多菜单 */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden" aria-label="更多">
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-40 min-w-40 rounded-2xl border border-line bg-popover p-1.5 text-fg shadow-floating data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              >
                {actions.map(({ label, icon: Icon, dialog }) => (
                  <DropdownMenu.Item
                    key={label}
                    onSelect={() => openDialog(dialog)}
                    className="flex h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm outline-none data-[highlighted]:bg-subtle"
                  >
                    <Icon className="size-4 text-fg-muted" />
                    {label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
    </>
  );
}
