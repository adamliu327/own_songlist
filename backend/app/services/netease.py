import re
import httpx
from typing import Any, Dict, List, Optional
from app.config import get_settings
from app.schemas import SearchCandidate

settings = get_settings()

DEFAULT_COVER_MARKERS = ("5639395138885805", "6y-UleORITEDbvrOLV0Q8A==")

URL_RE = re.compile(r"https?://[^\s'\"<>）)]+")
PLAYLIST_ID_RES = (
    re.compile(r"[?&]id=(\d+)"),
    re.compile(r"/playlist/(\d+)"),
)
PLAYLIST_PAGE_SIZE = 1000


def _first(value: Any) -> Any:
    return value[0] if isinstance(value, list) and value else value


def _is_default_cover(url: Optional[str]) -> bool:
    if not url:
        return True
    return any(marker in url for marker in DEFAULT_COVER_MARKERS)


def _extract_cover(song: dict) -> Optional[str]:
    # 新版/原版 API 返回的封面字段位置不一致，做多级兜底
    album = song.get("album") or song.get("al") or {}
    if isinstance(album, dict):
        for key in ("picUrl", "blurPicUrl", "coverImgUrl", "img80x80", "img1v1Url"):
            url = album.get(key)
            if url and not _is_default_cover(url):
                return url

    artist = _first(song.get("artists") or song.get("ar") or [])
    if isinstance(artist, dict):
        for key in ("picUrl", "img1v1Url", "coverImgUrl"):
            url = artist.get(key)
            if url and not _is_default_cover(url):
                return url

    for key in ("picUrl", "coverImgUrl", "imgUrl"):
        url = song.get(key)
        if url and not _is_default_cover(url):
            return url

    return None


def _extract_album_name(song: dict) -> Optional[str]:
    album = song.get("album") or song.get("al") or {}
    if isinstance(album, dict):
        return album.get("name")
    return None


async def _fetch_song_detail_covers(client: httpx.AsyncClient, song_ids: List[str]) -> Dict[str, str]:
    """通过 /song/detail 批量获取更准确的封面。"""
    if not song_ids:
        return {}

    url = f"{settings.netease_api_url}/song/detail"
    params = {"ids": ",".join(song_ids)}

    try:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
    except Exception:
        return {}

    covers: Dict[str, str] = {}
    for song in data.get("songs", []):
        song_id = str(song.get("id", ""))
        cover = _extract_cover(song)
        if song_id and cover:
            covers[song_id] = cover
    return covers


def _extract_playlist_id(text: str) -> Optional[str]:
    for pattern in PLAYLIST_ID_RES:
        m = pattern.search(text)
        if m:
            return m.group(1)
    return None


def _track_singer(song: dict) -> str:
    artists = song.get("artists") or song.get("ar") or []
    if isinstance(artists, dict):
        artists = [artists]
    return "/".join(a.get("name", "") for a in artists if isinstance(a, dict) and a.get("name"))


async def resolve_playlist_id(url_or_id: str) -> str:
    """从分享文本 / 各种形态的歌单链接 / 纯数字 ID 中解析出歌单 ID。

    短链（如 163cn.tv）需要跟随一次重定向后再从目标 URL 提取。
    """
    text = url_or_id.strip()
    if text.isdigit():
        return text

    playlist_id = _extract_playlist_id(text)
    if playlist_id:
        return playlist_id

    m = URL_RE.search(text)
    if not m:
        raise ValueError("无法识别歌单链接，请粘贴网易云歌单分享链接或歌单 ID")

    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
        response = await client.head(m.group(0))
        playlist_id = _extract_playlist_id(str(response.url))

    if not playlist_id:
        raise ValueError("链接中未找到歌单 ID，请确认是网易云歌单分享链接")
    return playlist_id


async def fetch_netease_playlist(url_or_id: str) -> Dict[str, Any]:
    """拉取歌单标题与全部曲目。超过 1000 首时用 /playlist/track/all 分页。"""
    playlist_id = await resolve_playlist_id(url_or_id)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{settings.netease_api_url}/playlist/detail", params={"id": playlist_id}
        )
        response.raise_for_status()
        data = response.json()
        playlist = data.get("playlist")
        if data.get("code") != 200 or not playlist:
            raise ValueError("获取歌单失败，请确认歌单存在且为公开状态")

        total = len(playlist.get("trackIds") or []) or int(playlist.get("trackCount") or 0)

        tracks: List[dict] = []
        offset = 0
        while offset < total:
            response = await client.get(
                f"{settings.netease_api_url}/playlist/track/all",
                params={"id": playlist_id, "limit": PLAYLIST_PAGE_SIZE, "offset": offset},
            )
            response.raise_for_status()
            page = response.json().get("songs") or []
            if not page:
                break
            tracks.extend(page)
            offset += len(page)

    items = [
        {
            "external_id": str(song.get("id", "")),
            "name": song.get("name", ""),
            "singer": _track_singer(song),
            "cover": _extract_cover(song),
        }
        for song in tracks
        if song.get("name")
    ]

    return {
        "playlist_id": playlist_id,
        "title": playlist.get("name"),
        "total": len(items),
        "items": items,
    }


async def search_netease(keyword: str, limit: int = 10) -> List[SearchCandidate]:
    url = f"{settings.netease_api_url}/search"
    params = {"keywords": keyword, "type": 1, "limit": limit}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        result = data.get("result", {})
        songs = result.get("songs", [])

        candidates: List[SearchCandidate] = []
        for song in songs:
            singer = _track_singer(song)

            candidates.append(
                SearchCandidate(
                    source="netease",
                    external_id=str(song.get("id", "")),
                    name=song.get("name", ""),
                    singer=singer,
                    cover=_extract_cover(song),
                    album=_extract_album_name(song),
                )
            )

        # 对默认/缺失封面的候选，批量查 song/detail 兜底
        ids_needing_cover = [c.external_id for c in candidates if _is_default_cover(c.cover)]
        if ids_needing_cover:
            detail_covers = await _fetch_song_detail_covers(client, ids_needing_cover)
            for candidate in candidates:
                if _is_default_cover(candidate.cover) and candidate.external_id in detail_covers:
                    candidate.cover = detail_covers[candidate.external_id]

    return candidates
