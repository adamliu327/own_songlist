import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_unlock
from app.database import get_db
from app.errors import UserError
from app.models import Song as SongModel
from app.schemas import PlaylistPreviewRequest, PlaylistPreviewResponse, PlaylistTrackItem
from app.services.netease import fetch_netease_playlist
from app.services.starlwr import normalize_name

router = APIRouter()
logger = logging.getLogger(__name__)


def local_song_keys(db: Session) -> set[tuple[str, str]]:
    """本地库的（歌名, 歌手）归一化键集合，用于标记/跳过重复。"""
    return {
        (normalize_name(s.name), normalize_name(s.singer or ""))
        for s in db.query(SongModel).all()
    }


# 预览本身不写库，但它是「添加歌曲」的一部分，而且会让后端对外发请求，所以也要求先解锁
@router.post(
    "/netease/preview",
    response_model=PlaylistPreviewResponse,
    dependencies=[Depends(require_unlock)],
)
async def preview_netease_playlist(body: PlaylistPreviewRequest, db: Session = Depends(get_db)):
    """解析网易云歌单链接，返回全部曲目并标记本地已存在的歌曲。"""
    try:
        playlist = await fetch_netease_playlist(body.url)
    except UserError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("获取网易云歌单失败")
        raise HTTPException(status_code=502, detail="获取歌单失败，网易云服务暂时不可用，请稍后再试")

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
