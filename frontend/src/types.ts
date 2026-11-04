// 直接用后端的字段名，不做 camelCase 转换

export interface Song {
  id: string;
  name: string;
  singer?: string | null;
  language?: string | null;
  remark?: string | null;
  cover?: string | null;
  created_at?: string;
}

export interface SongInput {
  name: string;
  singer?: string;
  language?: string;
  remark?: string;
  cover?: string;
}

export interface AppConfig {
  playlist_name: string;
  danmaku_template: string;
  default_language_filter: string;
}

export interface Candidate {
  source: 'netease';
  external_id: string;
  name: string;
  singer: string;
  cover?: string | null;
  album?: string | null;
  /** 毫秒 */
  duration?: number | null;
}

export interface LyricResult {
  external_id: string;
  lyric?: string | null;
  translation?: string | null;
  romaji?: string | null;
  no_lyric: boolean;
}

export interface PlaylistPreview {
  playlist_id: string;
  title?: string | null;
  total: number;
  items: { external_id: string; name: string; singer?: string | null; cover?: string | null; exists: boolean }[];
}

export interface CompareResult {
  source_title?: string | null;
  matched_count: number;
  items: { local_id: string }[];
}

export type CompareMode = 'overlap' | 'localOnly';

export interface Overlap {
  title: string;
  ids: Set<string>;
  mode: CompareMode;
}
