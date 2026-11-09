import { describe, expect, it } from 'vitest';
import { buildLrc, buildSrt, hasTimeline, subtitleFilename } from './lrc';

const lines = (...rows: string[]) => rows.join('\n') + '\n';

describe('buildLrc', () => {
  it('按时间排序，原样保留每一行', () => {
    const lyric = '[00:05.00] 第二句 \n[00:01.00]第一句\n没有时间标签的行会被丢掉';

    expect(buildLrc({ lyric })).toBe(lines('[00:01.00]第一句', '[00:05.00] 第二句'));
  });

  it('补上缺少的歌名和歌手标签，已有的不重复加', () => {
    expect(buildLrc({ lyric: '[00:01.00]a', name: '晴天', singer: '周杰伦' })).toBe(
      lines('[ti:晴天]', '[ar:周杰伦]', '[00:01.00]a'),
    );
    expect(buildLrc({ lyric: '[ti:原标题]\n[by:某人]\n[00:01.00]a', name: '晴天', singer: '周杰伦' })).toBe(
      lines('[ti:原标题]', '[ar:周杰伦]', '[by:某人]', '[00:01.00]a'),
    );
  });

  it('双语时译文跟在原文下面，缺译文的句子只有原文', () => {
    const lyric = '[00:01.00]line one\n[00:05.00]line two\n[00:09.00]line three';
    const extra = '[00:01.00]第一句\n[00:09.00]第三句';

    expect(buildLrc({ lyric, extra })).toBe(
      lines('[00:01.00]line one', '[00:01.00]第一句', '[00:05.00]line two', '[00:09.00]line three', '[00:09.00]第三句'),
    );
  });

  it('译文时间有几十毫秒偏差也能配上', () => {
    expect(buildLrc({ lyric: '[00:01.00]a\n[00:05.00]b', extra: '[00:01.06]甲\n[00:04.95]乙' })).toBe(
      lines('[00:01.00]a', '[00:01.06]甲', '[00:05.00]b', '[00:04.95]乙'),
    );
  });

  it('空行标记不会抢走后一句的译文', () => {
    // 译文的时间离空标记比离下一句还近。空标记要是参与配对，「乙」就会被它拿走，b 反而没有译文
    const lyric = '[00:01.00]a\n[00:04.95]\n[00:05.00]b';
    const extra = '[00:01.00]甲\n[00:04.97]乙';

    expect(buildLrc({ lyric, extra })).toBe(
      lines('[00:01.00]a', '[00:01.00]甲', '[00:04.95]', '[00:05.00]b', '[00:04.97]乙'),
    );
  });

  it('只有时间轴、没有文字的译文行不输出', () => {
    expect(buildLrc({ lyric: '[00:01.00]a', extra: '[00:01.00]' })).toBe(lines('[00:01.00]a'));
  });

  it('一行带多个时间标签时，每个时间点各出一行', () => {
    const lyric = '[00:10.00][00:40.00]副歌\n[00:20.00]中间一句';

    expect(buildLrc({ lyric })).toBe(lines('[00:10.00]副歌', '[00:20.00]中间一句', '[00:40.00]副歌'));
    expect(buildLrc({ lyric, extra: '[00:10.00][00:40.00]chorus\n[00:20.00]middle' })).toBe(
      lines(
        '[00:10.00]副歌',
        '[00:10.00]chorus',
        '[00:20.00]中间一句',
        '[00:20.00]middle',
        '[00:40.00]副歌',
        '[00:40.00]chorus',
      ),
    );
  });

  it('认得 [mm:ss]、[mm:ss.x]、[mm:ss:xx]、[mm:ss.xxx] 几种时间写法', () => {
    const srt = buildSrt({ lyric: '[00:01]a\n[00:02.5]b\n[00:03:25]c\n[00:04.125]d', durationMs: 5_000 });

    expect(srt.match(/^\d\d:\d\d:\d\d,\d{3}(?= -->)/gm)).toEqual([
      '00:00:01,000',
      '00:00:02,500',
      '00:00:03,250',
      '00:00:04,125',
    ]);
  });
});

describe('buildSrt', () => {
  const cues = (srt: string) =>
    srt
      .trim()
      .split('\n\n')
      .map((block) => block.split('\n').slice(1).join(' | '));

  it('每句在下一句开始前 0.2 秒结束，末句挂到歌曲结束', () => {
    expect(cues(buildSrt({ lyric: '[00:01.00]a\n[00:05.00]b', durationMs: 9_000 }))).toEqual([
      '00:00:01,000 --> 00:00:04,800 | a',
      '00:00:05,000 --> 00:00:09,000 | b',
    ]);
  });

  it('留间隔后不足半秒的短句，直接接到下一句开头', () => {
    expect(cues(buildSrt({ lyric: '[00:01.00]a\n[00:01.60]b', durationMs: 5_000 }))[0]).toBe(
      '00:00:01,000 --> 00:00:01,600 | a',
    );
  });

  it('原歌词里的空行标记优先当作这句的结束时间', () => {
    expect(cues(buildSrt({ lyric: '[00:01.00]a\n[00:03.00]\n[00:05.00]b', durationMs: 9_000 }))[0]).toBe(
      '00:00:01,000 --> 00:00:03,000 | a',
    );
  });

  it('不知道歌曲时长时，末句给 4 秒', () => {
    expect(cues(buildSrt({ lyric: '[00:01.00]a' }))).toEqual(['00:00:01,000 --> 00:00:05,000 | a']);
  });

  it('字幕不会超出歌曲时长', () => {
    expect(cues(buildSrt({ lyric: '[00:01.00]a\n[00:03.00]\n[00:05.00]b', durationMs: 2_000 }))[0]).toBe(
      '00:00:01,000 --> 00:00:02,000 | a',
    );
  });

  it('双语并进同一条字幕，译文在上', () => {
    expect(cues(buildSrt({ lyric: '[00:01.00]hello', extra: '[00:01.00]你好', durationMs: 3_000 }))).toEqual([
      '00:00:01,000 --> 00:00:03,000 | 你好 | hello',
    ]);
  });

  it('同一时间点的多行并成一条，不产生零时长字幕', () => {
    expect(cues(buildSrt({ lyric: '[00:00.00]作词 : 甲\n[00:00.00]作曲 : 乙\n[00:10.00]第一句', durationMs: 20_000 }))).toEqual([
      '00:00:00,000 --> 00:00:09,800 | 作词 : 甲 | 作曲 : 乙',
      '00:00:10,000 --> 00:00:20,000 | 第一句',
    ]);
  });

  it('一行带多个时间标签时不丢句，字幕里也不带时间标签', () => {
    expect(cues(buildSrt({ lyric: '[00:10.00][00:40.00]副歌\n[00:20.00]中间一句', durationMs: 60_000 }))).toEqual([
      '00:00:10,000 --> 00:00:19,800 | 副歌',
      '00:00:20,000 --> 00:00:39,800 | 中间一句',
      '00:00:40,000 --> 00:01:00,000 | 副歌',
    ]);
  });

  it('条目从 1 开始编号，超过一小时的时间也写对', () => {
    const srt = buildSrt({ lyric: '[61:01.50]a', durationMs: 3_700_000 });

    expect(srt).toBe('1\n01:01:01,500 --> 01:01:40,000\na\n');
  });
});

describe('hasTimeline', () => {
  it('有带时间轴的句子才算', () => {
    expect(hasTimeline('[00:01.00]第一句')).toBe(true);
    expect(hasTimeline('[00:10.00][00:40.00]副歌')).toBe(true);
  });

  it('纯文本歌词、只有元信息、只有空标记都不算', () => {
    expect(hasTimeline('作词 : 某人\n第一句歌词\n第二句歌词')).toBe(false);
    expect(hasTimeline('[ti:歌名]\n[ar:歌手]')).toBe(false);
    expect(hasTimeline('[00:01.00]\n[00:02.00]')).toBe(false);
  });
});

describe('subtitleFilename', () => {
  it('歌手在前，去掉文件名里不能用的字符', () => {
    expect(subtitleFilename('a/b:c?', ' 歌手 ', 'srt')).toBe('歌手 - a_b_c_.srt');
    expect(subtitleFilename('晴天', undefined, 'lrc')).toBe('晴天.lrc');
  });

  it('太长的截断，什么都没有时用默认名', () => {
    expect(subtitleFilename('长'.repeat(200), '', 'lrc')).toBe(`${'长'.repeat(120)}.lrc`);
    expect(subtitleFilename('  ', '', 'srt')).toBe('lyric.srt');
  });
});
