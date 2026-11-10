import { describe, expect, it } from 'vitest';
import { sortSongs } from './sortSongs';
import type { Song } from '@/types';

const song = (name: string, singer: string | null, created_at?: string): Song => ({ id: name, name, singer, created_at });
const names = (songs: Song[]) => songs.map((s) => s.name);

describe('sortSongs', () => {
  const songs = [
    song('晴天', '周杰伦', '2026-11-02T08:00:00'),
    song('Lemon', '米津玄師', '2026-11-03T08:00:00'),
    song('七里香', '周杰伦', '2026-11-01T08:00:00'),
  ];

  it('按歌手、再按歌名排', () => {
    expect(names(sortSongs(songs, 'name'))).toEqual(['Lemon', '七里香', '晴天']);
  });

  it('最新添加的在前', () => {
    expect(names(sortSongs(songs, 'newest'))).toEqual(['Lemon', '晴天', '七里香']);
  });

  it('最早添加的在前', () => {
    expect(names(sortSongs(songs, 'oldest'))).toEqual(['七里香', '晴天', 'Lemon']);
  });

  it('同一秒导入的歌保持原来的先后，正序倒序都一样', () => {
    const batch = [
      song('单独加的', null, '2026-11-05T08:00:00'),
      song('歌单第一首', null, '2026-11-04T08:00:00'),
      song('歌单第二首', null, '2026-11-04T08:00:00'),
      song('歌单第三首', null, '2026-11-04T08:00:00'),
    ];

    expect(names(sortSongs(batch, 'newest'))).toEqual(['单独加的', '歌单第一首', '歌单第二首', '歌单第三首']);
    expect(names(sortSongs(batch, 'oldest'))).toEqual(['歌单第一首', '歌单第二首', '歌单第三首', '单独加的']);
  });

  it('不改动传入的数组', () => {
    const before = names(songs);

    sortSongs(songs, 'newest');

    expect(names(songs)).toEqual(before);
  });
});
