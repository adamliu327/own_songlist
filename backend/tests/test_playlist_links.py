"""从用户粘贴的内容里认出歌单 ID，以及解析短链时不替人访问别的地址。"""
import asyncio

import httpx
import pytest

from app.errors import UserError
from app.services import netease


def resolve(text: str) -> str:
    return asyncio.run(netease.resolve_playlist_id(text))


def redirect_to(target: str):
    return lambda request: httpx.Response(302, headers={"location": target})


@pytest.mark.parametrize(
    "text, playlist_id",
    [
        ("https://music.163.com/#/playlist?id=24381616", "24381616"),
        ("https://music.163.com/playlist?id=24381616&userid=9", "24381616"),
        ("https://y.music.163.com/m/playlist?userid=9&id=24381616&creatorId=9", "24381616"),
        ("https://music.163.com/#/my/m/music/playlist?id=24381616", "24381616"),
        ("http://music.163.com/playlist/24381616/9/?userid=9", "24381616"),
        # 榜单也是歌单
        ("https://music.163.com/#/discover/toplist?id=3778678", "3778678"),
        ("分享歌单: 我喜欢 https://music.163.com/m/playlist?id=24381616&userid=9 (来自@网易云音乐)", "24381616"),
        # 歌曲、专辑、用户主页的链接里也有 id=，但不是歌单
        ("https://music.163.com/song?id=186016", None),
        ("https://music.163.com/#/album?id=3154175", None),
        ("https://music.163.com/#/user/home?id=1234", None),
        ("https://music.163.com/song?id=1&from=playlist", None),
    ],
)
def test_playlist_id_is_only_read_from_playlist_links(text, playlist_id):
    assert netease._extract_playlist_id(text) == playlist_id


def test_plain_id_needs_no_request(upstream):
    seen = upstream(lambda request: httpx.Response(200))

    assert resolve(" 24381616 ") == "24381616"
    assert seen == []


def test_short_link_is_resolved_from_its_redirect_target(upstream):
    seen = upstream(redirect_to("https://music.163.com/playlist?id=555&userid=1"))

    assert resolve("看这个 http://163cn.tv/AbCd12 哈") == "555"
    # 目标地址里已经有歌单 ID，不用再去请求它
    assert [request.url.host for request in seen] == ["163cn.tv"]


@pytest.mark.parametrize(
    "url",
    [
        "http://netease-api:3000/",
        "http://127.0.0.1:8000/docs",
        "http://169.254.169.254/latest",
        "https://evil.example/x",
        "http://music.163.com@evil.example/",
        "http://163.com.evil.example/",
    ],
)
def test_links_outside_netease_are_refused_without_a_request(upstream, url):
    seen = upstream(lambda request: httpx.Response(200))

    with pytest.raises(UserError, match="只支持网易云音乐"):
        resolve(url)
    assert seen == []


def test_redirect_to_another_host_is_not_followed(upstream):
    seen = upstream(redirect_to("http://169.254.169.254/latest"))

    with pytest.raises(UserError, match="只支持网易云音乐"):
        resolve("http://163cn.tv/x")
    assert [request.url.host for request in seen] == ["163cn.tv"]


def test_redirect_loop_gives_up(upstream):
    seen = upstream(redirect_to("http://163cn.tv/loop"))

    with pytest.raises(UserError, match="未找到歌单 ID"):
        resolve("http://163cn.tv/loop")
    assert len(seen) == netease.MAX_REDIRECTS


def test_song_link_gets_a_readable_error(upstream):
    upstream(lambda request: httpx.Response(200))

    with pytest.raises(UserError, match="未找到歌单 ID"):
        resolve("https://music.163.com/song?id=186016")


@pytest.mark.parametrize("text", ["随便写点什么", "²", "ftp://music.163.com/x"])
def test_text_without_a_link_is_rejected(upstream, text):
    seen = upstream(lambda request: httpx.Response(200))

    with pytest.raises(UserError, match="无法识别歌单链接"):
        resolve(text)
    assert seen == []
