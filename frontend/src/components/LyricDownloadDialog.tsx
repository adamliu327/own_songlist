import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, Download, FileMusic, Music } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchSourcePanel } from './SearchSourcePanel';
import { fetchNeteaseLyric } from '@/lib/api';
import {
  buildLrc,
  buildSrt,
  downloadTextFile,
  subtitleFilename,
  type LrcFormat,
} from '@/lib/lrc';
import type { LyricResult, SearchCandidate } from '@/types';

interface LyricDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMAT_LABELS: Record<LrcFormat, string> = {
  original: '仅原文',
  translation: '原文 + 翻译',
  romaji: '原文 + 罗马音',
};

export function LyricDownloadDialog({ open, onOpenChange }: LyricDownloadDialogProps) {
  const [candidate, setCandidate] = useState<SearchCandidate | null>(null);
  const [lyric, setLyric] = useState<LyricResult | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [format, setFormat] = useState<LrcFormat>('original');

  useEffect(() => {
    if (open) {
      setCandidate(null);
      setLyric(null);
      setLoadingId(null);
      setFormat('original');
    }
  }, [open]);

  const handleSelect = async (picked: SearchCandidate) => {
    setLoadingId(picked.externalId);
    try {
      const result = await fetchNeteaseLyric(picked.externalId);
      if (result.no_lyric || !result.lyric) {
        toast.error('这首歌没有歌词', {
          description: '可能是纯音乐，或网易云未收录歌词',
        });
        return;
      }
      setCandidate(picked);
      setLyric(result);
      setFormat(result.translation ? 'translation' : 'original');
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error('获取歌词失败', { description: detail || '请稍后重试' });
    } finally {
      setLoadingId(null);
    }
  };

  const availableFormats = useMemo<LrcFormat[]>(() => {
    if (!lyric) return ['original'];
    return [
      'original' as const,
      ...(lyric.translation ? (['translation'] as const) : []),
      ...(lyric.romaji ? (['romaji'] as const) : []),
    ];
  }, [lyric]);

  const extraLyric = useMemo(() => {
    if (!lyric) return null;
    return format === 'translation' ? lyric.translation : format === 'romaji' ? lyric.romaji : null;
  }, [lyric, format]);

  const lrcText = useMemo(() => {
    if (!lyric?.lyric || !candidate) return '';
    return buildLrc({
      lyric: lyric.lyric,
      extra: extraLyric,
      name: candidate.name,
      singer: candidate.singer,
    });
  }, [lyric, candidate, extraLyric]);

  const handleDownload = (ext: 'lrc' | 'srt') => {
    if (!candidate || !lyric?.lyric) return;
    const text =
      ext === 'lrc'
        ? lrcText
        : buildSrt({ lyric: lyric.lyric, extra: extraLyric, durationMs: candidate.duration });
    if (!text) return;

    const filename = subtitleFilename(candidate.name, candidate.singer, ext);
    downloadTextFile(filename, text);
    toast.success('已下载', { description: filename });
  };

  const handleCopy = async () => {
    if (!lrcText) return;
    try {
      await navigator.clipboard.writeText(lrcText);
      toast.success('歌词已复制到剪贴板');
    } catch {
      toast.error('复制失败', { description: '浏览器拒绝了剪贴板访问' });
    }
  };

  const showResult = !!candidate && !!lyric;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-2xl font-bold text-ink">
              下载歌词
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              搜索网易云音乐，选中歌曲即可保存带时间轴的 .lrc 歌词文件。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-w-0 space-y-5 p-6 pt-4">
          {/* 结果页只是盖住搜索面板，保留关键词和候选列表，方便连续下载多首 */}
          <div className={showResult ? 'hidden' : 'space-y-5'}>
            <SearchSourcePanel
              onSelect={handleSelect}
              actionLabel="取歌词"
              busyExternalId={loadingId}
            />
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <FileMusic className="h-3.5 w-3.5 shrink-0" />
              歌词来自网易云音乐，仅供个人使用
            </p>
          </div>

          {showResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-pink/40 bg-pink-light/30 p-3">
                {candidate.cover ? (
                  <img
                    src={candidate.cover}
                    alt={candidate.name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pink-light">
                    <Music className="h-6 w-6 text-pink-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold text-ink">{candidate.name}</p>
                  <p className="truncate text-sm text-ink-muted">{candidate.singer}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCandidate(null);
                    setLyric(null);
                  }}
                  className="shrink-0 gap-1 rounded-xl text-ink-muted hover:bg-white/70 hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" />
                  换一首
                </Button>
              </div>

              {availableFormats.length > 1 && (
                <div className="flex gap-2 rounded-2xl bg-pink-light/50 p-1.5">
                  {availableFormats.map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormat(option)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                        format === option
                          ? 'bg-white text-ink shadow-sm'
                          : 'text-ink-muted hover:bg-white/50 hover:text-ink'
                      }`}
                    >
                      {FORMAT_LABELS[option]}
                    </button>
                  ))}
                </div>
              )}

              <pre className="max-h-[280px] overflow-auto rounded-2xl border border-pink/40 bg-pink-light/20 p-4 font-mono text-xs leading-relaxed whitespace-pre text-ink">
                {lrcText}
              </pre>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2 rounded-xl border-pink/50"
                >
                  <Copy className="h-4 w-4" />
                  复制
                </Button>
                <Button
                  onClick={() => handleDownload('lrc')}
                  title="给音乐播放器用"
                  className="gap-2 rounded-xl bg-mint font-bold text-ink hover:bg-mint/90"
                >
                  <Download className="h-4 w-4" />
                  下载 .lrc
                </Button>
                <Button
                  onClick={() => handleDownload('srt')}
                  title="给剪映等剪辑软件用"
                  className="gap-2 rounded-xl bg-peach font-bold text-white hover:bg-peach/90"
                >
                  <Download className="h-4 w-4" />
                  下载 .srt
                </Button>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted">
                .srt 每句的结束时间优先按原歌词的空行断句，否则取下一句开始前 0.2 秒，末句挂到歌曲结束；双语会并进同一条字幕的两行（译文在上），导入剪映后再微调即可。
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
