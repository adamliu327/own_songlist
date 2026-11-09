// 和后端 services/matching.py 用同一套规则：全角转半角、转小写、去掉所有空白。
// 两边不一致的话，搜索页的「已在歌单」和导入页的「已存在」会对同一首歌给出不同的判断
const normalize = (text?: string | null) => (text ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');

/** 歌名 + 歌手归一化后的键，键相同就算同一首歌 */
export const songKey = (name: string, singer?: string | null) => `${normalize(name)}|${normalize(singer)}`;
