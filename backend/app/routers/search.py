import logging
from typing import Literal

from fastapi import APIRouter, Query, HTTPException

from app.schemas import SearchResponse
from app.services.netease import search_netease

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=SearchResponse)
async def search(
    keyword: str = Query(..., min_length=1),
    source: Literal["netease"] = Query("netease"),
    limit: int = Query(10, ge=1, le=50),
):
    try:
        if source == "netease":
            items = await search_netease(keyword, limit=limit)
        else:
            items = []
        return SearchResponse(items=items)
    except Exception:
        logger.exception("网易云搜索失败")
        raise HTTPException(status_code=502, detail="搜索服务暂时不可用，请稍后再试")
