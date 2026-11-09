from fastapi import APIRouter, Query

from app.errors import upstream_errors
from app.schemas import LyricResponse
from app.services.netease import fetch_netease_lyric

router = APIRouter()


@router.get("/netease", response_model=LyricResponse)
async def netease_lyric(id: str = Query(..., min_length=1)):
    """按网易云歌曲 ID 取歌词，前端据此拼装 .lrc 文件。"""
    with upstream_errors("获取歌词失败，网易云服务暂时不可用，请稍后再试"):
        data = await fetch_netease_lyric(id)

    return LyricResponse(**data)
