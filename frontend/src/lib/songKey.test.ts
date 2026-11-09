import { describe, expect, it } from 'vitest';
import { songKey } from './songKey';

// 这里的例子和后端 tests/test_compare.py、tests/test_songs.py 里的是同一批，两边的规则要保持一致
describe('songKey', () => {
  it('大小写、空格、全半角不同，算同一首', () => {
    expect(songKey('ＬＯＶＥ　ｓｔｏｒｙ', 'taylor  swift')).toBe(songKey('Love Story', 'Taylor Swift'));
    expect(songKey('  晴 天 ', '周杰伦')).toBe(songKey('晴天', '周杰伦'));
  });

  it('歌名一样、歌手不同，是另一首', () => {
    expect(songKey('七里香', '周杰伦')).not.toBe(songKey('七里香', '翻唱歌手'));
  });

  it('没有歌手和歌手为空是一回事', () => {
    expect(songKey('晴天', null)).toBe(songKey('晴天', ''));
    expect(songKey('晴天')).toBe(songKey('晴天', '  '));
  });
});
