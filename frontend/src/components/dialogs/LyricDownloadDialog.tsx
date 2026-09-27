import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, FileMusic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogShell } from '@/components/common/DialogShell';
import { Segmented } from '@/components/common/Segmented';
import { SearchSourcePanel } from '@/components/common/SearchSourcePanel';
import { SongCover } from '@/components/common/SongCover';
import { fetchNeteaseLyric } from '@/lib/api';
import { errorDetail } from '@/lib/utils';
import { writeClipboard } from '@/lib/clipboard';
import { buildLrc, buildSrt, downloadTextFile, subtitleFilename, type LrcFormat } from '@/lib/lrc';
import { useDialog } from '@/stores/uiStore';
import type { LyricResult, SearchCandidate } from '@/types';

const FORMAT_LABELS: Record<LrcFormat, string> = {
  original: '仅原文',
  translation: '原文 + 翻译',
  romaji: '原文 + 罗马音',
};

export function LyricDownloadDialog() {
  const { open, onOpenChange } = useDialog('lyric');

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="下载歌词"
      description="搜索网易云音乐，选中歌曲后保存带时间轴的 .lrc / .srt。"
      icon={FileMusic}
      className="sm:max-w-xl"
    >
      <LyricBody />
    </DialogShell>
  );
}

interface Picked {
  candidate: SearchCandidate;
  lyric: LyricResult;
}

function LyricBody() {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [format, setFormat] = useState<LrcFormat>('original');

  const pick = async (candidate: SearchCandidate) => {
    setLoadingId(candidate.externalId);
    try {
      const lyric = await fetchNeteaseLyric(candidate.externalId);
      if (lyric.no_lyric || !lyric.lyric) {
        toast.error('这首歌没有歌词', { description: '可能是纯音乐，或者网易云没有收录' });
        return;
      }
      setPicked({ candidate, lyric });
      setFormat(lyric.translation ? 'translation' : 'original');
    } catch (err) {
      toast.error('获取歌词失败', { description: errorDetail(err) || '请稍后重试' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      {/* 结果页只是盖住搜索面板，保留关键词和结果，方便连续下载 */}
      <div className={picked ? 'hidden' : undefined}>
        <SearchSourcePanel
          renderAction={(c) => (
            <Button size="sm" onClick={() => pick(c)} disabled={loadingId !== null} className="min-w-16">
              {loadingId === c.externalId ? <Loader2 className="animate-spin" /> : '取歌词'}
            </Button>
          )}
          footer={<p className="text-xs text-fg-muted">歌词来自网易云音乐，仅供个人使用</p>}
        />
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <LyricResultView picked={picked} format={format} onFormat={setFormat} onBack={() => setPicked(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface LyricResultViewProps {
  picked: Picked;
  format: LrcFormat;
  onFormat: (format: LrcFormat) => void;
  onBack: () => void;
}

function LyricResultView({ picked: { candidate, lyric }, format, onFormat, onBack }: LyricResultViewProps) {
  const formats: LrcFormat[] = [
    'original',
    ...(lyric.translation ? (['translation'] as const) : []),
    ...(lyric.romaji ? (['romaji'] as const) : []),
  ];
  const extra = format === 'translation' ? lyric.translation : format === 'romaji' ? lyric.romaji : null;

  const lrcText = useMemo(
    () => buildLrc({ lyric: lyric.lyric!, extra, name: candidate.name, singer: candidate.singer }),
    [lyric, extra, candidate],
  );

  const download = (ext: 'lrc' | 'srt') => {
    const text = ext === 'lrc' ? lrcText : buildSrt({ lyric: lyric.lyric!, extra, durationMs: candidate.duration });
    const filename = subtitleFilename(candidate.name, candidate.singer, ext);
    downloadTextFile(filename, text);
    toast.success('已下载', { description: filename });
  };

  const copy = async () => {
    try {
      await writeClipboard(lrcText);
      toast.success('歌词已复制');
    } catch {
      toast.error('复制失败', { description: '浏览器拒绝了剪贴板访问' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-subtle p-2.5">
        <SongCover src={candidate.cover} alt={candidate.name} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{candidate.name}</p>
          <p className="truncate text-sm text-fg-muted">{candidate.singer}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
          换一首
        </Button>
      </div>

      {formats.length > 1 && (
        <Segmented<LrcFormat>
          value={format}
          onChange={onFormat}
          options={formats.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
        />
      )}

      <LrcPreview text={lrcText} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={copy}>
          <Copy />
          复制
        </Button>
        <Button onClick={() => download('lrc')} title="给音乐播放器用">
          <Download />
          下载 .lrc
        </Button>
        <Button variant="peach" onClick={() => download('srt')} title="给剪映等剪辑软件用">
          <Download />
          下载 .srt
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-fg-muted">
        .srt 每句的结束时间优先按原歌词的空行断句，否则取下一句开始前 0.2 秒，末句挂到歌曲结束；双语会并进同一条字幕的两行（译文在上），导入剪映后再微调即可。
      </p>
    </div>
  );
}

/** 时间轴、元信息标签淡化显示，歌词正文突出 */
function LrcPreview({ text }: { text: string }) {
  return (
    <pre className="max-h-[min(300px,40dvh)] overflow-auto rounded-2xl border border-line bg-subtle p-4 font-mono text-xs leading-relaxed whitespace-pre text-fg">
      {text.split('\n').map((line, i) => {
        const m = /^((?:\[[^\]]*\])+)(.*)$/.exec(line);
        return (
          <div key={i}>
            {m ? (
              <>
                <span className="text-fg-muted/60">{m[1]}</span>
                {m[2]}
              </>
            ) : (
              line || ' '
            )}
          </div>
        );
      })}
    </pre>
  );
}
