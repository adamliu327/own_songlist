import { useState } from 'react';
import { toast } from 'sonner';
import { GitCompare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogShell } from '@/components/common/DialogShell';
import { compareExternalSonglist } from '@/lib/api';
import { errorDetail } from '@/lib/utils';
import { useDialog } from '@/stores/uiStore';
import { useSongStore } from '@/stores/songStore';

export function CompareDialog() {
  const { open, onOpenChange } = useDialog('compare');

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="对比外部歌单"
      description="填主播的 songlist 歌单网址，主页会筛出和你的歌单按歌名重合的歌。"
      icon={GitCompare}
    >
      <CompareForm onDone={() => onOpenChange(false)} />
    </DialogShell>
  );
}

function CompareForm({ onDone }: { onDone: () => void }) {
  const setOverlap = useSongStore((s) => s.setOverlap);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const compare = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    setLoading(true);
    try {
      const data = await compareExternalSonglist(target);
      const title = data.source_title || target;
      if (data.matched_count === 0) {
        toast.info('没有重合的歌曲', { description: `你的歌单和「${title}」按歌名没有交集` });
        return;
      }
      setOverlap({ matchedIds: data.items.map((item) => item.local_id), title, mode: 'overlap' });
      toast.success(`和「${title}」重合 ${data.matched_count} 首`);
      onDone();
    } catch (err) {
      toast.error('对比失败', { description: errorDetail(err) || '无法获取该歌单，请检查网址是否正确' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={compare} className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="网址、域名或 B 站 uid"
          spellCheck={false}
          autoFocus
          className="h-12 rounded-2xl"
        />
        <Button type="submit" size="lg" disabled={!url.trim() || loading} className="rounded-2xl">
          {loading ? <Loader2 className="animate-spin" /> : '对比'}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-fg-muted">
        支持完整网址、纯域名、子域前缀，或者直接填主播的 B 站 uid。按歌名宽松匹配，忽略大小写、空格和全半角。
      </p>
    </form>
  );
}
