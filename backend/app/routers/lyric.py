import logging

from fastapi import APIRouter, HTTPException, Query

from app.errors import UserError
from app.schemas import LyricResponse
from app.services.netease import fetch_netease_lyric

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/netease", response_model=LyricResponse)
async def netease_lyric(id: str = Query(..., min_length=1)):
    """按网易云歌曲 ID 取歌词，前端据此拼装 .lrc 文件。"""
    try:
        data = await fetch_netease_lyric(id)
    except UserError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("获取网易云歌词失败")
        raise HTTPException(status_code=502, detail="获取歌词失败，网易云服务暂时不可用，请稍后再试")

    return LyricResponse(**data)
