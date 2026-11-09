"""拉歌单、搜索、取歌词：上游返回各种情况时的处理。"""
import asyncio

import httpx
import pytest

from app.errors import UserError
from app.services import netease

# 网易云的默认封面，等于没有封面
DEFAULT_COVER = "https://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg"


def playlist_handler(track_ids, gone=()):
    """模拟 API 服务：/playlist/track/all 按曲目 ID 列表切片，再去掉已下架的歌。"""

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/playlist/detail":
            playlist = {"name": "测试歌单", "trackIds": [{"id": i} for i in track_ids]}
            return httpx.Response(200, json={"code": 200, "playlist": playlist})
        offset, limit = int(request.url.params["offset"]), int(request.url.params["limit"])
        page = [
            {"id": i, "name": f"歌{i}", "ar": [{"name": "歌手"}], "al": {"picUrl": f"https://img.test/{i}.jpg"}}
            for i in track_ids[offset : offset + limit]
            if i not in gone
        ]
        return httpx.Response(200, json={"songs": page})

    return handler


def test_playlist_preview_marks_songs_already_in_the_list(client, upstream):
    client.post("/songs/", json={"name": "歌2", "singer": "歌手"})
    upstream(playlist_handler([1, 2, 3]))

    preview = client.post("/import/netease/preview", json={"url": "42"}).json()

    assert preview["title"] == "测试歌单"
    assert preview["total"] == 3
    assert [(item["name"], item["exists"]) for item in preview["items"]] == [
        ("歌1", False),
        ("歌2", True),
        ("歌3", False),
    ]
    assert preview["items"][0]["cover"] == "https://img.test/1.jpg"


def test_large_playlist_is_paged_without_duplicates(upstream):
    """有下架歌曲的那一页会少几首。翻页要按页大小前进，不然下一页会和上一页重叠。"""
    track_ids = list(range(1, 2501))
    seen = upstream(playlist_handler(track_ids, gone={5, 1500}))

    playlist = asyncio.run(netease.fetch_netease_playlist("42"))

    ids = [item["external_id"] for item in playlist["items"]]
    assert len(ids) == len(set(ids)) == 2498
    offsets = [request.url.params["offset"] for request in seen if request.url.path == "/playlist/track/all"]
    assert offsets == ["0", "1000", "2000"]


def test_missing_playlist_gets_a_readable_error(client, upstream):
    upstream(lambda request: httpx.Response(404, json={"code": 404}))

    response = client.post("/import/netease/preview", json={"url": "99999999999999"})

    assert response.status_code == 400
    assert response.json()["detail"] == netease.PLAYLIST_UNAVAILABLE


@pytest.mark.parametrize(
    "method, path, body",
    [
        ("GET", "/search/?keyword=x", None),
        ("GET", "/lyric/netease?id=1", None),
        ("POST", "/import/netease/preview", {"url": "42"}),
    ],
)
def test_upstream_failure_does_not_leak_internals(client, upstream, method, path, body):
    def unreachable(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("All connection attempts failed", request=request)

    upstream(unreachable)

    response = client.request(method, path, json=body)

    assert response.status_code == 502
    detail = response.json()["detail"]
    assert "netease.test" not in detail
    assert "connection" not in detail.lower()


def test_search_maps_fields_and_fills_in_missing_covers(client, upstream):
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/search":
            songs = [
                {
                    "id": 1,
                    "name": "晴天",
                    "artists": [{"name": "周杰伦"}],
                    "album": {"name": "叶惠美", "picUrl": "https://img.test/1.jpg"},
                    "duration": 269000,
                },
                # 搜索结果里是默认封面，要再去 /song/detail 查真正的封面
                {"id": 2, "name": "合唱", "artists": [{"name": "甲"}, {"name": "乙"}], "album": {"picUrl": DEFAULT_COVER}},
            ]
            return httpx.Response(200, json={"result": {"songs": songs}})
        assert request.url.path == "/song/detail"
        assert request.url.params["ids"] == "2"
        return httpx.Response(200, json={"songs": [{"id": 2, "al": {"picUrl": "https://img.test/2.jpg"}}]})

    upstream(handler)

    first, second = client.get("/search/?keyword=晴天").json()["items"]

    assert first == {
        "source": "netease",
        "external_id": "1",
        "name": "晴天",
        "singer": "周杰伦",
        "cover": "https://img.test/1.jpg",
        "album": "叶惠美",
        "duration": 269000,
    }
    assert second["singer"] == "甲/乙"
    assert second["cover"] == "https://img.test/2.jpg"


def lyric_response(payload: dict):
    return lambda request: httpx.Response(200, json=payload)


def test_lyric_returns_original_translation_and_romaji(client, upstream):
    upstream(
        lyric_response(
            {
                "code": 200,
                "lrc": {"lyric": "[00:01.00]こんにちは\n"},
                "tlyric": {"lyric": "[00:01.00]你好\n"},
                "romalrc": {"lyric": "[00:01.00]konnichiwa\n"},
            }
        )
    )

    assert client.get("/lyric/netease?id=7").json() == {
        "external_id": "7",
        "lyric": "[00:01.00]こんにちは",
        "translation": "[00:01.00]你好",
        "romaji": "[00:01.00]konnichiwa",
        "no_lyric": False,
    }


def test_translation_with_only_timestamps_counts_as_missing(client, upstream):
    """网易云常返回只有时间轴、没有文字的翻译，要当成没有。"""
    upstream(lyric_response({"code": 200, "lrc": {"lyric": "[00:01.00]晴天"}, "tlyric": {"lyric": "[00:01.00]\n[00:05.00]"}}))

    lyric = client.get("/lyric/netease?id=7").json()

    assert lyric["lyric"] == "[00:01.00]晴天"
    assert lyric["translation"] is None


@pytest.mark.parametrize(
    "payload",
    [
        {"code": 200, "nolyric": True},
        {"code": 200, "uncollected": True},
        {"code": 200, "lrc": {"lyric": ""}},
    ],
)
def test_songs_without_lyrics_are_flagged(client, upstream, payload):
    upstream(lyric_response(payload))

    assert client.get("/lyric/netease?id=7").json()["no_lyric"] is True


def test_lyric_error_code_gets_a_readable_error(upstream):
    upstream(lyric_response({"code": 404}))

    with pytest.raises(UserError, match="歌曲 ID"):
        asyncio.run(netease.fetch_netease_lyric("7"))
