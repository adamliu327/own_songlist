import { useState } from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SongCoverProps {
  src?: string;
  alt: string;
  className?: string;
}

/** 封面：加载完成后淡入，没有封面或加载失败时露出底下的音符占位 */
export function SongCover({ src, alt, className }: SongCoverProps) {
  return (
    <div
      className={cn(
        'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pink-light dark:bg-subtle',
        className,
      )}
    >
      <Music className="size-[45%] text-pink-300" />
      {src && <CoverImage key={src} src={src} alt={alt} />}
    </div>
  );
}

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  if (state === 'failed') return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setState('loaded')}
      onError={() => setState('failed')}
      className={cn(
        'absolute inset-0 size-full object-cover transition-opacity duration-300',
        state === 'loaded' ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}
