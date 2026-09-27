import { Music, Settings, Lock, Unlock, GitCompare, FileMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore, requiresUnlock } from '@/stores/authStore';

interface AppHeaderProps {
  onOpenSettings: () => void;
  onOpenCompare: () => void;
  onOpenLyric: () => void;
  onUnlock: () => void;
}

export function AppHeader({
  onOpenSettings,
  onOpenCompare,
  onOpenLyric,
  onUnlock,
}: AppHeaderProps) {
  const { config } = useConfigStore();
  const { isUnlocked, lock } = useAuthStore();

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-mint/20 via-pink/20 to-peach/20 px-6 py-8 sm:py-10">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-peach/20 blur-3xl" />
      <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-mint/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl items-start justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft"
          >
            <Music className="h-7 w-7 text-mint" />
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl"
            >
              {config.playlistName}
            </motion.h1>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          {requiresUnlock && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isUnlocked ? lock : onUnlock}
              title={isUnlocked ? '锁定' : '解锁'}
              className="rounded-xl text-ink-muted hover:bg-white/60 hover:text-ink"
            >
              {isUnlocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenLyric}
            title="下载歌词"
            className="rounded-xl text-ink-muted hover:bg-white/60 hover:text-ink"
          >
            <FileMusic className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCompare}
            title="对比外部歌单"
            className="rounded-xl text-ink-muted hover:bg-white/60 hover:text-ink"
          >
            <GitCompare className="h-5 w-5" />
          </Button>

          {(!requiresUnlock || isUnlocked) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              title="设置"
              className="rounded-xl text-ink-muted hover:bg-white/60 hover:text-ink"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </motion.div>
      </div>
    </header>
  );
}
