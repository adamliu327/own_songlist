from fastapi import APIRouter, HTTPException, Query

from app.schemas import LyricResponse
from app.services.netease import fetch_netease_lyric

router = APIRouter()


@router.get("/netease", response_model=LyricResponse)
async def netease_lyric(id: str = Query(..., min_length=1)):
    """按网易云歌曲 ID 取歌词，前端据此拼装 .lrc 文件。"""
    try:
        data = await fetch_netease_lyric(id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"获取歌词失败: {e}")

    return LyricResponse(**data)
