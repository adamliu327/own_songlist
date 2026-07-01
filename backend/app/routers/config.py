from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Config as ConfigModel
from app.schemas import ConfigItem

router = APIRouter()

DEFAULT_CONFIG = {
    "playlist_name": "我的点歌单",
    "danmaku_template": "点歌 {name}",
    "default_language_filter": "",
    "theme": "system",
}


class ConfigUpdate(BaseModel):
    items: List[ConfigItem]


@router.get("/")
def get_config(db: Session = Depends(get_db)):
    rows = {row.key: row.value for row in db.query(ConfigModel).all()}
    result = dict(DEFAULT_CONFIG)
    result.update(rows)
    return result


@router.put("/")
def update_config(payload: ConfigUpdate, db: Session = Depends(get_db)):
    for item in payload.items:
        if item.key not in DEFAULT_CONFIG:
            raise HTTPException(status_code=400, detail=f"未知配置项: {item.key}")
        existing = db.query(ConfigModel).filter(ConfigModel.key == item.key).first()
        if existing:
            existing.value = item.value
        else:
            db.add(ConfigModel(key=item.key, value=item.value))
    db.commit()
    return get_config(db)


@router.post("/reset")
def reset_config(db: Session = Depends(get_db)):
    db.query(ConfigModel).delete()
    db.commit()
    return get_config(db)
