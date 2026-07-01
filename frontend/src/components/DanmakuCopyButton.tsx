import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useDanmakuCopy } from '@/hooks/useDanmakuCopy';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

interface DanmakuCopyButtonProps {
  song: Song;
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function DanmakuCopyButton({ song, size = 'default', className }: DanmakuCopyButtonProps) {
  const { copy } = useDanmakuCopy();
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await copy(song);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isIcon = size === 'icon';

  return (
    <Button
      size={isIcon ? 'icon' : size}
      onClick={handleClick}
      disabled={copied}
      title="复制点歌弹幕"
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold transition-all duration-300',
        copied
          ? 'bg-mint text-ink hover:bg-mint'
          : 'bg-peach text-white shadow-md shadow-peach/20 hover:bg-peach/90 hover:shadow-lg hover:shadow-peach/30',
        isIcon ? '' : size === 'sm' ? 'px-3 text-xs' : 'px-5 text-sm',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {!isIcon && <span>已复制</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {!isIcon && <span>复制</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
