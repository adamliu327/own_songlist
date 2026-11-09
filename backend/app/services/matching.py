"""歌名归一化和判重。批量添加、歌单导入、对比歌单都按这里的规则认「同一首歌」。"""
import re
import unicodedata
from typing import Optional

from sqlalchemy.orm import Session

from app.models import Song


def normalize_name(name: Optional[str]) -> str:
    """全角转半角、转小写、去掉所有空白，用于宽松匹配。"""
    if not name:
        return ""
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", name).lower())


def song_key(name: Optional[str], singer: Optional[str]) -> tuple[str, str]:
    """（歌名, 歌手）归一化后的键，键相同就算同一首歌。

    前端 AddSongDrawer 里的 songKey 用的是同一套规则，改这里要一起改。
    """
    return normalize_name(name), normalize_name(singer)


def local_song_keys(db: Session) -> set[tuple[str, str]]:
    """本地库里所有歌的键，用于标记 / 跳过重复。"""
    return {song_key(song.name, song.singer) for song in db.query(Song).all()}
