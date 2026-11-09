from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import upstream_errors
from app.models import Song as SongModel
from app.schemas import CompareRequest, CompareResponse, CompareItem
from app.services.matching import normalize_name
from app.services.starlwr import fetch_external_songlist

router = APIRouter()


@router.post("/external", response_model=CompareResponse)
async def compare_external(body: CompareRequest, db: Session = Depends(get_db)):
    """拉取外部（songlist.cc / StarBot）歌单，按歌名（宽松）找出本地库里和它重合的歌。"""
    with upstream_errors("获取外部歌单失败，对方服务暂时不可用，请稍后再试"):
        external = await fetch_external_songlist(body.url)

    external_names = {normalize_name(song.get("name")) for song in external["songs"]} - {""}
    items = [
        CompareItem(local_id=local.id)
        for local in db.query(SongModel).all()
        if normalize_name(local.name) in external_names
    ]

    return CompareResponse(source_title=external.get("title"), matched_count=len(items), items=items)
