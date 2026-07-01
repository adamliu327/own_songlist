import re
import unicodedata
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse, parse_qs

import httpx

from app.config import get_settings

settings = get_settings()


def normalize_target(raw: str) -> Tuple[str, int]:
    """把用户输入的各种写法归一化成 getView 需要的 (host, uid)。

    支持：
    - 完整网址 ``https://abc.songlist.cc/``
    - 纯域名 ``abc.songlist.cc``
    - songlist.cc 子域前缀 ``abc`` → 补成 ``abc.songlist.cc``
    - 官方默认页带 uid ``https://bot.starlwr.com/songlist?uid=123456``
    - 纯数字 ``123456`` → 当作 B 站 uid
    """
    s = (raw or "").strip()
    if not s:
        raise ValueError("请填写歌单网址")

    # 纯数字 → 当作 B 站 uid，走官方默认域名
    if s.isdigit():
        return "bot.starlwr.com", int(s)

    # 补上协议方便 urlparse 统一解析
    parse_src = s if "://" in s else "//" + s
    parsed = urlparse(parse_src, scheme="https")
    host = parsed.netloc or parsed.path.split("/")[0]
    host = host.split("@")[-1].split(":")[0].strip().lower()

    if not host:
        raise ValueError("无法识别的网址")

    # 没有点，认为是 songlist.cc 的子域前缀，如 "abc"
    if "." not in host:
        host = f"{host}.songlist.cc"

    uid = 0
    if "starlwr.com" in host:
        uid_vals = parse_qs(parsed.query).get("uid")
        if uid_vals and uid_vals[0].isdigit():
            uid = int(uid_vals[0])

    return host, uid


async def fetch_external_songlist(raw_url: str) -> Dict[str, Any]:
    """调用 StarBot 的公开只读接口拉取整份歌单。"""
    host, uid = normalize_target(raw_url)
    payload = {"url": host, "uid": uid}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{settings.starlwr_api_url}/songlist/getView",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    if data.get("code", -1) < 0:
        raise ValueError(data.get("msg") or "获取外部歌单失败")

    view = data.get("data") or {}
    if not view.get("enabled", False):
        raise ValueError("该歌单未开启或不存在")

    return {
        "title": view.get("title"),
        "uid": view.get("uid"),
        "songs": view.get("songs") or [],
    }


def normalize_name(name: str) -> str:
    """歌名归一化：全角转半角、转小写、去掉所有空白。用于宽松匹配。"""
    if not name:
        return ""
    s = unicodedata.normalize("NFKC", name)
    s = s.lower()
    s = re.sub(r"\s+", "", s)
    return s.strip()


def index_external_by_name(songs: List[dict]) -> Dict[str, List[dict]]:
    """把外部歌单按归一化歌名建索引（同名可能对应多首）。"""
    index: Dict[str, List[dict]] = {}
    for song in songs:
        key = normalize_name(song.get("name") or "")
        if key:
            index.setdefault(key, []).append(song)
    return index
