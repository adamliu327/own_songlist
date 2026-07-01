from fastapi import APIRouter, Query, HTTPException
from typing import Literal
from app.schemas import SearchResponse
from app.services.netease import search_netease

router = APIRouter()


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
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"搜索服务不可用: {str(e)}")
