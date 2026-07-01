import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { GitCompare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { compareExternalSonglist } from '@/lib/api';
import { useSongStore } from '@/stores/songStore';

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompareDialog({ open, onOpenChange }: CompareDialogProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const setOverlap = useSongStore((s) => s.setOverlap);

  useEffect(() => {
    if (open) {
      setUrl('');
      setLoading(false);
    }
  }, [open]);

  const handleCompare = async () => {
    const target = url.trim();
    if (!target) return;
    setLoading(true);
    try {
      const data = await compareExternalSonglist(target);
      if (data.matched_count === 0) {
        toast.info('没有重合的歌曲', {
          description: `你的歌单和「${data.source_title || target}」按歌名没有交集`,
        });
        return;
      }
      setOverlap({
        matchedIds: data.items.map((item) => item.local_id),
        title: data.source_title || target,
        mode: 'overlap',
      });
      toast.success(`已对比「${data.source_title || target}」`, {
        description: '主页可切换查看「重合」或「我有 ta 没有」的歌曲',
      });
      onOpenChange(false);
    } catch (e) {
      const detail = axios.isAxiosError(e)
        ? (e.response?.data as { detail?: string })?.detail
        : undefined;
      toast.error('对比失败', {
        description: detail || '无法获取该歌单，请检查网址是否正确',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
              <GitCompare className="h-6 w-6 text-mint" />
              对比外部歌单
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              填写主播的 songlist 歌单网址，主页会筛选出与你歌单按歌名重合的歌曲。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-w-0 space-y-4 p-6 pt-4">
          <div className="flex min-w-0 gap-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) handleCompare();
              }}
              spellCheck={false}
              className="h-11 min-w-0 flex-1 rounded-xl border-pink/40 text-base"
            />
            <Button
              onClick={handleCompare}
              disabled={!url.trim() || loading}
              className="h-11 shrink-0 gap-2 rounded-xl bg-mint px-5 font-bold text-ink hover:bg-mint/90 disabled:opacity-40"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/60 border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              对比
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">
            支持完整网址、纯域名、子域前缀，或直接填主播的 B 站 uid。按歌名宽松匹配（忽略大小写、空格、全半角）。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
