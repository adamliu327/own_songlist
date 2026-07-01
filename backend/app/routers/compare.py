from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Song as SongModel
from app.schemas import CompareRequest, CompareResponse, CompareItem
from app.services.starlwr import (
    fetch_external_songlist,
    index_external_by_name,
    normalize_name,
)

router = APIRouter()


@router.post("/external", response_model=CompareResponse)
async def compare_external(body: CompareRequest, db: Session = Depends(get_db)):
    """拉取外部（songlist.cc / StarBot）歌单，与本地库按歌名（宽松）比对出重合项。"""
    try:
        external = await fetch_external_songlist(body.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"获取外部歌单失败: {e}")

    ext_songs = external["songs"]
    ext_by_name = index_external_by_name(ext_songs)

    local_songs = db.query(SongModel).all()

    items: list[CompareItem] = []
    for local in local_songs:
        key = normalize_name(local.name)
        if not key or key not in ext_by_name:
            continue
        ext_singers = sorted(
            {
                (e.get("singer") or "").strip()
                for e in ext_by_name[key]
                if e.get("singer")
            }
        )
        items.append(
            CompareItem(
                local_id=local.id,
                name=local.name,
                local_singer=local.singer,
                external_singer=" / ".join(ext_singers) if ext_singers else None,
                language=local.language,
                style=local.style,
            )
        )

    items.sort(key=lambda x: normalize_name(x.name))

    return CompareResponse(
        source_title=external.get("title"),
        external_uid=external.get("uid"),
        external_total=len(ext_songs),
        local_total=len(local_songs),
        matched_count=len(items),
        items=items,
    )
