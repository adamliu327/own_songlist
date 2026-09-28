import { useState } from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SongCoverProps {
  src?: string;
  alt: string;
  className?: string;
  /** 默认懒加载；抽奖转轮里的封面要提前加载 */
  loading?: 'lazy' | 'eager';
}

/** 封面：加载完成后淡入，没有封面或加载失败时露出底下的音符占位 */
export function SongCover({ src, alt, className, loading = 'lazy' }: SongCoverProps) {
  return (
    <div
      className={cn(
        'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pink-light dark:bg-subtle',
        className,
      )}
    >
      <Music className="size-[45%] text-pink-300" />
      {src && <CoverImage key={src} src={src} alt={alt} loading={loading} />}
    </div>
  );
}

function CoverImage({ src, alt, loading }: { src: string; alt: string; loading: 'lazy' | 'eager' }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  if (state === 'failed') return null;
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onLoad={() => setState('loaded')}
      onError={() => setState('failed')}
      className={cn(
        'absolute inset-0 size-full object-cover transition-opacity duration-300',
        state === 'loaded' ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}
