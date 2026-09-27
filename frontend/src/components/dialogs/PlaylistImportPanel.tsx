import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Link2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SongCover } from '@/components/common/SongCover';
import { LanguagePicker } from '@/components/common/LanguagePicker';
import { previewNeteasePlaylist, batchCreateSongs } from '@/lib/api';
import { errorDetail } from '@/lib/utils';
import { useSongStore } from '@/stores/songStore';
import { cn } from '@/lib/utils';
import type { PlaylistPreview } from '@/types';

export function PlaylistImportPanel({ onDone }: { onDone: () => void }) {
  const loadSongs = useSongStore((s) => s.loadSongs);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PlaylistPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState('');

  const handlePreview = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    try {
      const data = await previewNeteasePlaylist(url.trim());
      setPreview(data);
      setSelected(new Set(data.items.filter((i) => !i.exists).map((i) => i.external_id)));
    } catch (e) {
      toast.error('获取歌单失败', { description: errorDetail(e) || '请检查链接是否正确，稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const allSelected = !!preview && preview.items.length > 0 && selected.size === preview.items.length;
  const existsCount = preview?.items.filter((i) => i.exists).length ?? 0;

  const handleImport = async () => {
    if (!preview || selected.size === 0) return;
    setImporting(true);
    try {
      const items = preview.items
        .filter((i) => selected.has(i.external_id))
        .map((i) => ({ name: i.name, singer: i.singer, cover: i.cover, language: language || undefined }));
      const result = await batchCreateSongs(items);
      toast.success(`已导入 ${result.created} 首`, {
        description: result.skipped > 0 ? `${result.skipped} 首已存在，自动跳过` : undefined,
      });
      await loadSongs();
      onDone();
    } catch {
      toast.error('导入失败', { description: '请稍后重试' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handlePreview();
        }}
      >
        <div className="relative flex-1">
          <Link2 className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴网易云歌单分享链接"
            className="h-12 rounded-2xl pl-10"
          />
        </div>
        <Button type="submit" size="lg" disabled={!url.trim() || loading} className="rounded-2xl">
          {loading ? <Loader2 className="animate-spin" /> : '获取'}
        </Button>
      </form>

      {!preview && (
        <p className="py-6 text-center text-sm text-fg-muted">支持分享文本、短链接或者歌单 ID</p>
      )}

      {preview && (
        <div className="animate-in space-y-4 fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="rounded-2xl bg-mint/10 px-4 py-3 text-sm text-fg">
            「<span className="font-semibold">{preview.title || '未命名歌单'}</span>」共 {preview.total} 首
            {existsCount > 0 && <span className="text-fg-muted">，{existsCount} 首已在歌单里</span>}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-fg-muted">导入的歌统一设为</p>
            <LanguagePicker value={language} onChange={setLanguage} emptyLabel="不设置" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() =>
                setSelected(allSelected ? new Set() : new Set(preview.items.map((i) => i.external_id)))
              }
              className="flex cursor-pointer items-center gap-2 text-fg"
            >
              <Checkbox checked={allSelected} />
              全选
            </button>
            <span className="text-fg-muted">已选 {selected.size} 首</span>
          </div>

          <div className="-mx-1 max-h-[min(340px,45dvh)] space-y-1.5 overflow-y-auto px-1">
            {preview.items.map((item) => {
              const checked = selected.has(item.external_id);
              return (
                <button
                  key={item.external_id}
                  type="button"
                  onClick={() => toggle(item.external_id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-2 text-left transition-colors',
                    checked ? 'border-mint/50 bg-mint/8' : 'border-line bg-subtle hover:border-mint/40',
                  )}
                >
                  <Checkbox checked={checked} />
                  <SongCover src={item.cover} alt={item.name} className="size-10 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{item.name}</p>
                    <p className="truncate text-xs text-fg-muted">{item.singer || '未知歌手'}</p>
                  </div>
                  {item.exists && (
                    <span className="shrink-0 rounded-full bg-track px-2 py-0.5 text-[11px] text-fg-muted">
                      已存在
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button size="lg" onClick={handleImport} disabled={selected.size === 0 || importing} className="w-full">
            {importing && <Loader2 className="animate-spin" />}
            {importing ? '导入中…' : `导入选中的 ${selected.size} 首`}
          </Button>
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
        checked ? 'border-mint bg-mint text-ink' : 'border-line bg-surface',
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  );
}
