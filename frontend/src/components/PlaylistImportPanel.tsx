import { useState } from 'react';
import { Link2, Loader2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { previewNeteasePlaylist, batchCreateSongs } from '@/lib/api';
import { useSongStore } from '@/stores/songStore';
import { LANGUAGE_OPTIONS } from '@/lib/constants';
import type { PlaylistPreview } from '@/types';

interface PlaylistImportPanelProps {
  onDone: () => void;
}

export function PlaylistImportPanel({ onDone }: PlaylistImportPanelProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PlaylistPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState('');
  const loadSongs = useSongStore((s) => s.loadSongs);

  const handlePreview = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setPreview(null);
    try {
      const data = await previewNeteasePlaylist(url.trim());
      setPreview(data);
      setSelected(new Set(data.items.filter((i) => !i.exists).map((i) => i.external_id)));
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error('获取歌单失败', {
        description: detail || '请检查链接是否正确，稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allSelected = !!preview && preview.items.length > 0 && selected.size === preview.items.length;

  const toggleAll = () => {
    if (!preview) return;
    setSelected(allSelected ? new Set() : new Set(preview.items.map((i) => i.external_id)));
  };

  const handleImport = async () => {
    if (!preview || selected.size === 0 || importing) return;
    setImporting(true);
    try {
      const items = preview.items
        .filter((i) => selected.has(i.external_id))
        .map((i) => ({
          name: i.name,
          singer: i.singer,
          cover: i.cover,
          language: language || undefined,
        }));
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

  const existsCount = preview ? preview.items.filter((i) => i.exists).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
            placeholder="粘贴网易云歌单分享链接..."
            className="h-12 rounded-2xl border-pink/60 bg-pink-light/30 pl-11 text-base focus:border-mint focus:ring-mint"
          />
        </div>
        <Button
          onClick={handlePreview}
          disabled={!url.trim() || loading}
          className="h-12 shrink-0 rounded-2xl bg-mint px-5 font-bold text-ink hover:bg-mint/90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '获取'}
        </Button>
      </div>

      {!preview && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-ink-muted">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pink-light">
            <Link2 className="h-6 w-6 text-pink-300" />
          </div>
          <p className="text-sm">支持歌单分享文本、链接或歌单 ID</p>
        </div>
      )}

      {preview && (
        <>
          <div className="rounded-2xl bg-mint/10 px-4 py-2.5 text-sm text-ink">
            「<span className="font-semibold">{preview.title || '未命名歌单'}</span>」共{' '}
            {preview.total} 首
            {existsCount > 0 && (
              <span className="text-ink-muted">，其中 {existsCount} 首已在本地歌单</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-mint"
              />
              全选
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 w-[150px] rounded-xl border-pink/60 bg-white px-3 py-0 text-sm focus:border-mint focus:ring-mint">
                <SelectValue placeholder="统一设置语言" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="">不设置语言</SelectItem>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {preview.items.map((item) => (
              <label
                key={item.external_id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-pink/40 bg-pink-light/30 p-2.5 transition-colors hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.external_id)}
                  onChange={() => toggle(item.external_id)}
                  className="h-4 w-4 shrink-0 accent-mint"
                />
                {item.cover ? (
                  <img
                    src={item.cover}
                    alt={item.name}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-light">
                    <Music className="h-5 w-5 text-pink-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="truncate text-xs text-ink-muted">{item.singer || '-'}</p>
                </div>
                {item.exists && (
                  <Badge variant="secondary" className="shrink-0 rounded-full bg-stone-100 text-xs text-stone-500">
                    已存在
                  </Badge>
                )}
              </label>
            ))}
          </div>

          <Button
            onClick={handleImport}
            disabled={selected.size === 0 || importing}
            className="w-full rounded-xl bg-mint font-bold text-ink hover:bg-mint/90 disabled:opacity-40"
          >
            {importing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                导入中...
              </span>
            ) : (
              `导入选中的 ${selected.size} 首`
            )}
          </Button>
        </>
      )}
    </div>
  );
}
