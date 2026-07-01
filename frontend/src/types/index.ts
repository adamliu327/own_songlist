export interface Song {
  id: string;
  name: string;
  singer?: string;
  language?: string;
  remark?: string;
  cover?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SearchCandidate {
  source: 'netease';
  externalId: string;
  name: string;
  singer: string;
  cover?: string;
  album?: string;
}

export interface AppConfig {
  playlistName: string;
  danmakuTemplate: string;
  defaultLanguageFilter?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface SongFilters {
  keyword: string;
  language: string;
}

export interface BackendSong {
  id: string;
  name: string;
  singer?: string;
  language?: string;
  remark?: string;
  cover?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BackendSearchCandidate {
  source: 'netease';
  external_id: string;
  name: string;
  singer: string;
  cover?: string;
  album?: string;
}

export interface PlaylistTrackItem {
  external_id: string;
  name: string;
  singer?: string;
  cover?: string;
  exists: boolean;
}

export interface PlaylistPreview {
  playlist_id: string;
  title?: string;
  total: number;
  items: PlaylistTrackItem[];
}

export interface CompareItem {
  local_id: string;
  name: string;
  local_singer?: string;
  external_singer?: string;
  language?: string;
  style?: string;
}

export type CompareMode = 'overlap' | 'localOnly';

export interface OverlapFilter {
  matchedIds: string[];
  title: string;
  mode: CompareMode;
}

export interface CompareResult {
  source_title?: string;
  external_uid?: number;
  external_total: number;
  local_total: number;
  matched_count: number;
  items: CompareItem[];
}
