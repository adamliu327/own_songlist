from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SongBase(BaseModel):
    name: str = Field(..., min_length=1)
    singer: Optional[str] = None
    language: Optional[str] = None
    style: Optional[str] = None
    remark: Optional[str] = None
    cover: Optional[str] = None


class SongCreate(SongBase):
    pass


class SongUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    singer: Optional[str] = None
    language: Optional[str] = None
    style: Optional[str] = None
    remark: Optional[str] = None
    cover: Optional[str] = None


class SongResponse(SongBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SearchCandidate(BaseModel):
    source: str
    external_id: str
    name: str
    singer: str
    cover: Optional[str] = None
    album: Optional[str] = None


class SearchResponse(BaseModel):
    items: list[SearchCandidate]


class ConfigItem(BaseModel):
    key: str
    value: str


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
    name: str
    local_singer: Optional[str] = None
    external_singer: Optional[str] = None
    language: Optional[str] = None
    style: Optional[str] = None


class CompareResponse(BaseModel):
    source_title: Optional[str] = None
    external_uid: Optional[int] = None
    external_total: int
    local_total: int
    matched_count: int
    items: list[CompareItem]
