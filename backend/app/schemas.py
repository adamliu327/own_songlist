from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SongCreate(BaseModel):
    # 写入时去掉首尾空白并限制长度；纯空格的歌名去掉后为空，会被 min_length 拦下
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=500)
    singer: Optional[str] = Field(None, max_length=500)
    language: Optional[str] = Field(None, max_length=50)
    remark: Optional[str] = Field(None, max_length=2000)
    cover: Optional[str] = Field(None, max_length=2000)


class SongUpdate(SongCreate):
    name: Optional[str] = Field(None, min_length=1, max_length=500)


class SongResponse(BaseModel):
    # 不继承上面的限制：库里已有的数据原样返回，不能因为某一条超长就让整个列表报错
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    singer: Optional[str] = None
    language: Optional[str] = None
    remark: Optional[str] = None
    cover: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SearchCandidate(BaseModel):
    source: str
    external_id: str
    name: str
    singer: str
    cover: Optional[str] = None
    album: Optional[str] = None
    duration: Optional[int] = None  # 毫秒


class SearchResponse(BaseModel):
    items: list[SearchCandidate]


class LyricResponse(BaseModel):
    external_id: str
    lyric: Optional[str] = None
    translation: Optional[str] = None
    romaji: Optional[str] = None
    no_lyric: bool = False


class ConfigItem(BaseModel):
    key: str
    value: str = Field(..., max_length=500)


class SongBatchRequest(BaseModel):
    items: list[SongCreate]


class SongBatchResponse(BaseModel):
    created: int
    skipped: int


class PlaylistPreviewRequest(BaseModel):
    url: str = Field(..., min_length=1)


class PlaylistTrackItem(BaseModel):
    external_id: str
    name: str
    singer: Optional[str] = None
    cover: Optional[str] = None
    exists: bool = False


class PlaylistPreviewResponse(BaseModel):
    playlist_id: str
    title: Optional[str] = None
    total: int
    items: list[PlaylistTrackItem]


class CompareRequest(BaseModel):
    url: str = Field(..., min_length=1)


class CompareItem(BaseModel):
    local_id: str


class CompareResponse(BaseModel):
    source_title: Optional[str] = None
    matched_count: int
    items: list[CompareItem]
