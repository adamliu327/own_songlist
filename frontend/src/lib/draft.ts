import type { Song, SongInput } from '@/types';

/** 歌曲表单的编辑状态，字段都是字符串 */
export type SongDraft = Required<SongInput>;

export const EMPTY_DRAFT: SongDraft = { name: '', singer: '', language: '', remark: '', cover: '' };

export const draftFrom = (song: Song): SongDraft => ({
  name: song.name,
  singer: song.singer ?? '',
  language: song.language ?? '',
  remark: song.remark ?? '',
  cover: song.cover ?? '',
});

/** 去掉首尾空格；清空的字段传空字符串，编辑时才能真正清掉 */
export const trimDraft = (draft: SongDraft): SongDraft => ({
  name: draft.name.trim(),
  singer: draft.singer.trim(),
  language: draft.language,
  remark: draft.remark.trim(),
  cover: draft.cover.trim(),
});
