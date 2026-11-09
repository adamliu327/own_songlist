from fastapi import APIRouter, Query

from app.errors import upstream_errors
from app.schemas import SearchResponse
from app.services.netease import search_netease

router = APIRouter()


@router.get("/", response_model=SearchResponse)
async def search(
    keyword: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
):
    with upstream_errors("搜索服务暂时不可用，请稍后再试"):
        items = await search_netease(keyword, limit=limit)

    return SearchResponse(items=items)
