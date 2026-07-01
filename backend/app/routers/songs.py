import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Song as SongModel
from app.schemas import SongCreate, SongUpdate, SongResponse, SongBatchRequest, SongBatchResponse
from app.services.starlwr import normalize_name

router = APIRouter()


@router.get("/", response_model=list[SongResponse])
def list_songs(
    keyword: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    style: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(SongModel)
    if keyword:
        query = query.filter(
            SongModel.name.ilike(f"%{keyword}%") | SongModel.singer.ilike(f"%{keyword}%")
        )
    if language:
        query = query.filter(SongModel.language == language)
    if style:
        query = query.filter(SongModel.style == style)
    return query.order_by(SongModel.created_at.desc()).all()


@router.post("/", response_model=SongResponse)
def create_song(song: SongCreate, db: Session = Depends(get_db)):
    db_song = SongModel(id=str(uuid.uuid4()), **song.model_dump())
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song


@router.post("/batch", response_model=SongBatchResponse)
def batch_create_songs(body: SongBatchRequest, db: Session = Depends(get_db)):
    """批量创建歌曲，按（歌名, 歌手）归一化去重，已存在的跳过。"""
    existing = {
        (normalize_name(s.name), normalize_name(s.singer or ""))
        for s in db.query(SongModel).all()
    }
    created = 0
    skipped = 0
    for item in body.items:
        key = (normalize_name(item.name), normalize_name(item.singer or ""))
        if key in existing:
            skipped += 1
            continue
        existing.add(key)
        db.add(SongModel(id=str(uuid.uuid4()), **item.model_dump()))
        created += 1
    db.commit()
    return SongBatchResponse(created=created, skipped=skipped)


@router.get("/{song_id}", response_model=SongResponse)
def get_song(song_id: str, db: Session = Depends(get_db)):
    db_song = db.query(SongModel).filter(SongModel.id == song_id).first()
    if not db_song:
        raise HTTPException(status_code=404, detail="歌曲不存在")
    return db_song


@router.put("/{song_id}", response_model=SongResponse)
def update_song(song_id: str, song: SongUpdate, db: Session = Depends(get_db)):
    db_song = db.query(SongModel).filter(SongModel.id == song_id).first()
    if not db_song:
        raise HTTPException(status_code=404, detail="歌曲不存在")

    for key, value in song.model_dump(exclude_unset=True).items():
        setattr(db_song, key, value)

    db.commit()
    db.refresh(db_song)
    return db_song


@router.delete("/{song_id}")
def delete_song(song_id: str, db: Session = Depends(get_db)):
    db_song = db.query(SongModel).filter(SongModel.id == song_id).first()
    if not db_song:
        raise HTTPException(status_code=404, detail="歌曲不存在")
    db.delete(db_song)
    db.commit()
    return {"message": "已删除"}
