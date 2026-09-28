export type LrcFormat = 'original' | 'translation' | 'romaji';

/** 时间标签 [mm:ss.xx] / [mm:ss:xx] / [mm:ss] */
const TIME_TAG_RE = /^\[(\d{1,4}):(\d{1,2})(?:[.:](\d{1,3}))?\]/;
/** 元信息标签 [ti:xxx] [ar:xxx] ... */
const META_TAG_RE = /^\[([a-zA-Z]+):(.*)\]$/;

/**
 * 副歌词与原文时间轴的最大容差，超出则视为不同句。
 * 网易云的 tlyric/romalrc 与 lrc 由同一份歌词生成，实测时间戳完全一致（差值 0ms），
 * 这里只为个别上传者手改歌词造成的几十毫秒偏差留余量；相邻句间隔通常在 500ms 以上，
 * 容差取小值可避免某句缺译文时把后一句的译文抢过来。
 */
const MATCH_TOLERANCE_MS = 100;

interface LrcLine {
  timeMs: number;
  raw: string;
  text: string;
}

interface ParsedLrc {
  meta: string[];
  lines: LrcLine[];
}

function parseLrc(text: string): ParsedLrc {
  const meta: string[] = [];
  const lines: LrcLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const timeMatch = TIME_TAG_RE.exec(line);
    if (timeMatch) {
      const [tag, minutes, seconds, fraction = ''] = timeMatch;
      // 两位小数是厘秒、三位是毫秒，补齐到毫秒再比较
      const fractionMs = fraction ? Number(fraction.padEnd(3, '0')) : 0;
      lines.push({
        timeMs: Number(minutes) * 60_000 + Number(seconds) * 1_000 + fractionMs,
        raw: line,
        text: line.slice(tag.length).trim(),
      });
      continue;
    }

    if (META_TAG_RE.test(line)) {
      meta.push(line);
    }
  }

  lines.sort((a, b) => a.timeMs - b.timeMs);
  return { meta, lines };
}

function metaTags(meta: string[], name?: string, singer?: string): string[] {
  const tagKey = (tag: string) => META_TAG_RE.exec(tag)?.[1].toLowerCase();
  const hasTag = (key: string) => meta.some((tag) => tagKey(tag) === key);

  const generated: string[] = [];
  if (name?.trim() && !hasTag('ti')) generated.push(`[ti:${name.trim()}]`);
  if (singer?.trim() && !hasTag('ar')) generated.push(`[ar:${singer.trim()}]`);
  if (generated.length === 0) return [...meta];

  // 补的标签紧跟已有 [ti:]，整体保持 ti → ar → 其他 的顺序
  const titleIndex = meta.findIndex((tag) => tagKey(tag) === 'ti');
  return titleIndex >= 0
    ? [...meta.slice(0, titleIndex + 1), ...generated, ...meta.slice(titleIndex + 1)]
    : [...generated, ...meta];
}

/**
 * 按时间轴给原文配上副歌词（翻译 / 罗马音）。
 * 两侧时间轴均由网易云同一份歌词生成，通常精确对齐；容差用于兜底轻微偏移。
 */
function pairByTime(base: LrcLine[], extra: LrcLine[]): { line: LrcLine; extra: LrcLine | null }[] {
  const pairs: { line: LrcLine; extra: LrcLine | null }[] = [];
  let cursor = 0;

  for (let i = 0; i < base.length; i += 1) {
    const line = base[i];

    // 空行是「这句唱完了」的标记，本身没有内容，不参与配对——否则它会吃掉
    // 紧跟其后那句的副歌词（网易云的空标记常只比下一句早 200~400ms）
    if (!line.text) {
      pairs.push({ line, extra: null });
      continue;
    }

    while (cursor < extra.length && extra[cursor].timeMs < line.timeMs - MATCH_TOLERANCE_MS) {
      cursor += 1;
    }

    const candidate = extra[cursor];
    const offset = candidate ? Math.abs(candidate.timeMs - line.timeMs) : Infinity;

    // 副歌词缺行时，容差范围内的下一行可能其实属于后面那句，谁更近算谁的
    const next = base[i + 1];
    const belongsToNext =
      !!candidate && !!next && !!next.text && Math.abs(candidate.timeMs - next.timeMs) < offset;

    if (candidate && offset <= MATCH_TOLERANCE_MS && !belongsToNext) {
      pairs.push({ line, extra: candidate });
      cursor += 1;
    } else {
      pairs.push({ line, extra: null });
    }
  }

  return pairs;
}

export interface BuildLrcOptions {
  lyric: string;
  extra?: string | null;
  name?: string;
  singer?: string;
}

/** 生成可直接保存为 .lrc 的文本；带 extra 时输出双语（原文 + 翻译/罗马音，各占一行）。 */
export function buildLrc({ lyric, extra, name, singer }: BuildLrcOptions): string {
  const base = parseLrc(lyric);
  const body = extra
    ? pairByTime(base.lines, parseLrc(extra).lines).flatMap(({ line, extra: ex }) =>
        ex?.text ? [line.raw, ex.raw] : [line.raw],
      )
    : base.lines.map((l) => l.raw);

  return [...metaTags(base.meta, name, singer), ...body].join('\n') + '\n';
}

/** 每句提前多久结束，留出与下一句的间隔 */
const SRT_GAP_MS = 200;
/** 提前留间隔后短于此值就不再留，直接接到下一句开头，避免出现一闪而过的字幕 */
const SRT_MIN_DURATION_MS = 500;
/** 末句既没有空标记也拿不到歌曲时长时的兜底时长 */
const SRT_FALLBACK_DURATION_MS = 4_000;

interface CueEndInput {
  startMs: number;
  nextStartMs: number | null;
  /** 本句之后、下一句之前的空标记时刻，原歌词明确的「这句唱完了」 */
  markerMs: number | null;
  /** 整首歌时长，末句据此结束，避免字幕超出音频 */
  durationMs?: number;
}

function cueEndMs({ startMs, nextStartMs, markerMs, durationMs }: CueEndInput): number {
  let end: number;

  if (markerMs !== null) {
    end = markerMs; // 空标记是原歌词明确的断句，最准确
  } else if (nextStartMs !== null) {
    const gapped = nextStartMs - SRT_GAP_MS;
    end = gapped - startMs >= SRT_MIN_DURATION_MS ? gapped : nextStartMs;
  } else if (durationMs && durationMs > startMs) {
    end = durationMs; // 末句挂到歌曲结束
  } else {
    end = startMs + SRT_FALLBACK_DURATION_MS;
  }

  // 字幕不该超出音频
  if (durationMs && durationMs > startMs) end = Math.min(end, durationMs);

  return Math.max(end, startMs + 1);
}

function formatSrtTime(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');

  return [
    pad(Math.floor(total / 3_600_000)),
    pad(Math.floor((total % 3_600_000) / 60_000)),
    pad(Math.floor((total % 60_000) / 1_000)),
  ].join(':') + `,${pad(total % 1_000, 3)}`;
}

export interface BuildSrtOptions {
  lyric: string;
  extra?: string | null;
  /** 整首歌时长（毫秒），用于给末句一个准确的结束时间 */
  durationMs?: number;
}

/**
 * 由普通 LRC 转 SRT：结束时间优先用原歌词里的空标记，其次取下一句开始前 0.2 秒，
 * 末句用整首歌时长（见上面几个常量的兜底规则）。
 * 双语时原文和译文并进同一条字幕的两行，避免在剪辑软件里变成两个重叠片段。
 */
export function buildSrt({ lyric, extra, durationMs }: BuildSrtOptions): string {
  const baseLines = parseLrc(lyric).lines;
  const pairs = pairByTime(baseLines, extra ? parseLrc(extra).lines : []);

  // 空行不产出字幕条目，只留下时刻用来给上一条收尾
  const markers = baseLines.filter((line) => !line.text).map((line) => line.timeMs);

  // 网易云歌词常有多行共用同一时间点（作词/作曲信息等），并成一条，否则会出现零时长字幕
  const cues: { timeMs: number; texts: string[] }[] = [];
  for (const { line, extra: ex } of pairs) {
    // 与 .lrc 相反：做视频字幕时译文是主字幕放上面，原文垫在下面
    const texts = [ex?.text, line.text].filter((text): text is string => !!text);
    if (texts.length === 0) continue;

    const last = cues[cues.length - 1];
    if (last && last.timeMs === line.timeMs) {
      last.texts.push(...texts);
    } else {
      cues.push({ timeMs: line.timeMs, texts });
    }
  }

  return cues
    .map((cue, index) => {
      const nextStartMs = cues[index + 1]?.timeMs ?? null;
      const markerMs =
        markers.find((mk) => mk > cue.timeMs && (nextStartMs === null || mk < nextStartMs)) ?? null;
      const end = cueEndMs({ startMs: cue.timeMs, nextStartMs, markerMs, durationMs });

      return `${index + 1}\n${formatSrtTime(cue.timeMs)} --> ${formatSrtTime(end)}\n${cue.texts.join('\n')}\n`;
    })
    .join('\n');
}

/** 去掉文件名里的非法字符，避免下载失败 */
export function subtitleFilename(name: string, singer: string | undefined, ext: 'lrc' | 'srt'): string {
  const stem = [singer?.trim(), name.trim()].filter(Boolean).join(' - ') || 'lyric';
  return `${stem.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120)}.${ext}`;
}

export function downloadTextFile(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
