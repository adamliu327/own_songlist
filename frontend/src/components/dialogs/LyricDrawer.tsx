import { useMemo, useState } from 'react';
import { Button, Drawer, Notification, Radio } from 'animal-island-ui';
import { ArrowLeftIcon, CopyIcon, DownloadIcon } from 'naive-icons';
import { api } from '@/api';
import { NeteaseSearch, SongCover } from '@/components/common';
import { useFocusOnOpen } from '@/hooks';
import { writeClipboard } from '@/lib/clipboard';
import { errorText } from '@/lib/constants';
import { buildLrc, buildSrt, downloadTextFile, hasTimeline, subtitleFilename, type LrcFormat } from '@/lib/lrc';
import { closeDialog } from '@/store';
import type { Candidate, LyricResult } from '@/types';

const SEARCH_ID = 'lyric-search';

const FORMAT_LABELS: Record<LrcFormat, string> = {
  original: '仅原文',
  translation: '原文 + 翻译',
  romaji: '原文 + 罗马音',
};

interface Picked {
  candidate: Candidate;
  lyric: LyricResult;
}

export function LyricDrawer({ open }: { open: boolean }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  useFocusOnOpen(open && !picked, SEARCH_ID);

  const pick = async (candidate: Candidate) => {
    setLoadingId(candidate.external_id);
    try {
      const lyric = await api.lyric(candidate.external_id);
      if (lyric.no_lyric || !lyric.lyric) {
        Notification.warning({ message: '这首歌没有歌词', description: '可能是纯音乐，或者网易云没有收录' });
        return;
      }
      setPicked({ candidate, lyric });
    } catch (err) {
      Notification.error({ message: '获取歌词失败', description: errorText(err) });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Drawer open={open} onClose={closeDialog} title="下载歌词" width="min(600px, 100vw)">
      {/* 看歌词时只是盖住搜索，返回后关键词和结果都还在，方便连着下载 */}
      <div hidden={!!picked}>
        <NeteaseSearch
          inputId={SEARCH_ID}
          renderAction={(c) => (
            <Button
              size="small"
              loading={loadingId === c.external_id}
              disabled={loadingId !== null}
              onClick={() => pick(c)}
            >
              取歌词
            </Button>
          )}
        />
        <p className="hint">歌词来自网易云音乐，仅供个人使用</p>
      </div>
      {picked && <LyricResultView key={picked.candidate.external_id} picked={picked} onBack={() => setPicked(null)} />}
    </Drawer>
  );
}

function LyricResultView({ picked: { candidate, lyric }, onBack }: { picked: Picked; onBack: () => void }) {
  // 网易云有些歌只收录了纯文本歌词：没有时间轴，做不了 .lrc / .srt，但还能看、能复制
  const timed = useMemo(() => hasTimeline(lyric.lyric!), [lyric]);
  const formats: LrcFormat[] = [
    'original',
    ...(lyric.translation ? (['translation'] as const) : []),
    ...(lyric.romaji ? (['romaji'] as const) : []),
  ];
  const [format, setFormat] = useState<LrcFormat>(lyric.translation ? 'translation' : 'original');
  const extra = format === 'translation' ? lyric.translation : format === 'romaji' ? lyric.romaji : null;

  // 预览和复制用的文本；没有时间轴时就是歌词原文
  const lrcText = useMemo(
    () =>
      timed
        ? buildLrc({ lyric: lyric.lyric!, extra, name: candidate.name, singer: candidate.singer })
        : lyric.lyric!.trim(),
    [timed, lyric, extra, candidate],
  );

  const download = (ext: 'lrc' | 'srt') => {
    const text =
      ext === 'lrc' ? lrcText : buildSrt({ lyric: lyric.lyric!, extra, durationMs: candidate.duration ?? undefined });
    const filename = subtitleFilename(candidate.name, candidate.singer, ext);
    downloadTextFile(filename, text);
    Notification.success({ message: '已下载', description: filename });
  };

  const copy = async () => {
    try {
      await writeClipboard(lrcText);
      Notification.success({ message: '歌词已复制' });
    } catch (err) {
      Notification.error({ message: '复制失败', description: errorText(err) });
    }
  };

  return (
    <div className="stack">
      <div className="result-row picked-song">
        <SongCover src={candidate.cover} size={48} />
        <div className="song-text">
          <p className="song-name truncate">{candidate.name}</p>
          <p className="song-sub truncate">{candidate.singer}</p>
        </div>
        <Button type="text" size="small" icon={<ArrowLeftIcon size={16} color="currentColor" />} onClick={onBack}>
          换一首
        </Button>
      </div>

      {timed && formats.length > 1 && (
        <Radio
          direction="horizontal"
          value={format}
          onChange={(v) => setFormat(v as LrcFormat)}
          options={formats.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
        />
      )}

      <LrcPreview text={lrcText} />

      <div className="row wrap end">
        <Button type="primary" icon={<CopyIcon size={16} color="currentColor" />} onClick={copy}>
          复制
        </Button>
        <Button type="primary" icon={<DownloadIcon size={16} color="currentColor" />} onClick={() => download('srt')} disabled={!timed} title="给剪映等剪辑软件用">
          下载 .srt
        </Button>
        <Button type="primary" icon={<DownloadIcon size={16} color="currentColor" />} onClick={() => download('lrc')} disabled={!timed} title="给音乐播放器用">
          下载 .lrc
        </Button>
      </div>

      {timed ? (
        <p className="hint">
          .lrc 给音乐播放器用，.srt 给剪映等剪辑软件用。.srt 每句的结束时间优先按原歌词的空行断句，否则取下一句开始前 0.2
          秒，末句挂到歌曲结束；双语会并进同一条字幕的两行（译文在上）。
        </p>
      ) : (
        <p className="hint">网易云只收录了这首歌的纯文本歌词，没有时间轴，生成不了 .lrc 和 .srt，只能复制文本。</p>
      )}
    </div>
  );
}

/** 时间轴和元信息标签淡化，歌词正文突出 */
function LrcPreview({ text }: { text: string }) {
  return (
    <div className="lrc-preview">
      {text.split('\n').map((line, i) => {
        const m = /^((?:\[[^\]]*\])+)(.*)$/.exec(line);
        return (
          <div key={i}>
            {m ? (
              <>
                <span className="lrc-tag">{m[1]}</span>
                {m[2]}
              </>
            ) : (
              line || ' '
            )}
          </div>
        );
      })}
    </div>
  );
}
