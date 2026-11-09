from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import require_unlock
from app.database import get_db
from app.errors import upstream_errors
from app.schemas import PlaylistPreviewRequest, PlaylistPreviewResponse, PlaylistTrackItem
from app.services.matching import local_song_keys, song_key
from app.services.netease import fetch_netease_playlist

router = APIRouter()


# 预览本身不写库，但它是「添加歌曲」的一部分，而且会让后端对外发请求，所以也要求先解锁
@router.post(
    "/netease/preview",
    response_model=PlaylistPreviewResponse,
    dependencies=[Depends(require_unlock)],
)
async def preview_netease_playlist(body: PlaylistPreviewRequest, db: Session = Depends(get_db)):
    """解析网易云歌单链接，返回全部曲目并标记本地已存在的歌曲。"""
    with upstream_errors("获取歌单失败，网易云服务暂时不可用，请稍后再试"):
        playlist = await fetch_netease_playlist(body.url)

    existing = local_song_keys(db)
    items = [
        PlaylistTrackItem(**track, exists=song_key(track["name"], track["singer"]) in existing)
        for track in playlist["items"]
    ]

    return PlaylistPreviewResponse(
        playlist_id=playlist["playlist_id"],
        title=playlist["title"],
        total=playlist["total"],
        items=items,
    )
