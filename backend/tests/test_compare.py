"""对比外部歌单：识别用户填的地址，按歌名宽松匹配。"""
import httpx
import pytest

from app.errors import UserError
from app.services.matching import normalize_name
from app.services.starlwr import normalize_target


@pytest.mark.parametrize(
    "raw, target",
    [
        ("https://abc.songlist.cc/", ("abc.songlist.cc", 0)),
        ("abc.songlist.cc", ("abc.songlist.cc", 0)),
        ("ABC", ("abc.songlist.cc", 0)),
        ("https://bot.starlwr.com/songlist?uid=123456", ("bot.starlwr.com", 123456)),
        ("123456", ("bot.starlwr.com", 123456)),
        # isdigit() 对「²」也返回 True，但它不是能转成整数的 uid
        ("²", ("².songlist.cc", 0)),
    ],
)
def test_target_is_normalized(raw, target):
    assert normalize_target(raw) == target


def test_empty_target_is_rejected():
    with pytest.raises(UserError, match="请填写"):
        normalize_target("   ")


@pytest.mark.parametrize(
    "name, normalized",
    [
        ("Love Story", "lovestory"),
        ("ＬＯＶＥ　ｓｔｏｒｙ", "lovestory"),
        ("  晴 天 ", "晴天"),
        ("", ""),
    ],
)
def test_names_are_compared_loosely(name, normalized):
    assert normalize_name(name) == normalized


def external_songlist(songs, **view):
    payload = {"code": 0, "data": {"enabled": True, "title": "主播的歌单", "uid": 1, "songs": songs, **view}}

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "starlwr.test"
        return httpx.Response(200, json=payload)

    return handler


def test_compare_returns_the_local_songs_that_overlap(client, upstream):
    sunny = client.post("/songs/", json={"name": "晴天", "singer": "周杰伦"}).json()
    client.post("/songs/", json={"name": "七里香", "singer": "周杰伦"})
    upstream(external_songlist([{"name": "晴 天", "singer": "翻唱"}, {"name": "别的歌", "singer": "某人"}]))

    result = client.post("/compare/external", json={"url": "abc"}).json()

    assert result == {"source_title": "主播的歌单", "matched_count": 1, "items": [{"local_id": sunny["id"]}]}


def test_disabled_songlist_gets_a_readable_error(client, upstream):
    upstream(external_songlist([], enabled=False))

    response = client.post("/compare/external", json={"url": "abc"})

    assert response.status_code == 400
    assert response.json()["detail"] == "该歌单未开启或不存在"


def test_compare_upstream_failure_does_not_leak_internals(client, upstream):
    def unreachable(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("All connection attempts failed", request=request)

    upstream(unreachable)

    response = client.post("/compare/external", json={"url": "abc"})

    assert response.status_code == 502
    assert "starlwr.test" not in response.json()["detail"]
