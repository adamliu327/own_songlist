from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Song as SongModel
from app.schemas import PlaylistPreviewRequest, PlaylistPreviewResponse, PlaylistTrackItem
from app.services.netease import fetch_netease_playlist
from app.services.starlwr import normalize_name

router = APIRouter()


def local_song_keys(db: Session) -> set[tuple[str, str]]:
    """本地库的（歌名, 歌手）归一化键集合，用于标记/跳过重复。"""
    return {
        (normalize_name(s.name), normalize_name(s.singer or ""))
        for s in db.query(SongModel).all()
    }


@router.post("/netease/preview", response_model=PlaylistPreviewResponse)
async def preview_netease_playlist(body: PlaylistPreviewRequest, db: Session = Depends(get_db)):
    """解析网易云歌单链接，返回全部曲目并标记本地已存在的歌曲。"""
    try:
        playlist = await fetch_netease_playlist(body.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"获取歌单失败: {e}")

    existing = local_song_keys(db)
    items = [
        PlaylistTrackItem(
            **track,
            exists=(normalize_name(track["name"]), normalize_name(track["singer"] or "")) in existing,
        )
        for track in playlist["items"]
    ]

    return PlaylistPreviewResponse(
        playlist_id=playlist["playlist_id"],
        title=playlist["title"],
        total=playlist["total"],
        items=items,
    )
