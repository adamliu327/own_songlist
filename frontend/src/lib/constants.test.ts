import { describe, expect, it } from 'vitest';
import { renderDanmaku } from './constants';

describe('renderDanmaku', () => {
  it('把占位符换成歌曲信息，缺的字段留空', () => {
    expect(renderDanmaku('点歌 {name} - {singer} [{language}]', { name: '晴天', singer: '周杰伦', language: '国语' })).toBe(
      '点歌 晴天 - 周杰伦 [国语]',
    );
    expect(renderDanmaku('点歌 {name} {singer}', { name: '晴天', singer: null })).toBe('点歌 晴天');
  });

  it('同一个占位符可以出现多次，不认识的占位符原样保留', () => {
    expect(renderDanmaku('{name} {name} {style}', { name: 'a' })).toBe('a a {style}');
  });

  // 直接把歌名当替换字符串传给 replace 的话，下面这些写法会被当成特殊记号改掉
  it.each(['$$$', 'Pa$$ion', "Rock$'n", 'Cash $& Carry', '$1 $`'])('歌名 %s 原样输出', (name) => {
    expect(renderDanmaku('点歌 {name} - {singer}', { name, singer: 'A$$AP' })).toBe(`点歌 ${name} - A$$AP`);
  });

  it('歌名里碰巧带占位符字样时不会被二次替换', () => {
    expect(renderDanmaku('{name}/{singer}', { name: '{singer}', singer: 'S' })).toBe('{singer}/S');
  });
});
