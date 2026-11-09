"""编辑锁：没设密码时不拦，设了之后写接口必须带对密码。"""
import pytest

# 所有会改数据、或者会让后端替人对外发请求的接口
WRITES = [
    ("POST", "/songs/", {"name": "a"}),
    ("POST", "/songs/batch", {"items": [{"name": "b"}]}),
    ("PUT", "/songs/nope", {"name": "c"}),
    ("DELETE", "/songs/nope", None),
    ("PUT", "/config/", {"items": []}),
    ("DELETE", "/config/", None),
    ("POST", "/import/netease/preview", {"url": "123"}),
]


def test_without_password_everything_is_open(client):
    assert client.get("/auth/status").json() == {"required": False, "unlocked": True}
    assert client.post("/songs/", json={"name": "晴天"}).status_code == 200


def test_status_tells_whether_the_password_is_right(client, lock):
    assert client.get("/auth/status").json() == {"required": True, "unlocked": False}
    assert client.get("/auth/status", headers={"X-Edit-Password": "nope"}).json()["unlocked"] is False
    assert client.get("/auth/status", headers=lock).json() == {"required": True, "unlocked": True}


@pytest.mark.parametrize("method, path, body", WRITES)
def test_writes_are_rejected_without_the_right_password(client, lock, method, path, body):
    missing = client.request(method, path, json=body)
    wrong = client.request(method, path, json=body, headers={"X-Edit-Password": "nope"})

    assert missing.status_code == 401
    assert wrong.status_code == 401
    assert missing.json()["detail"] == "需要先解锁编辑"


def test_nothing_is_written_while_locked(client, lock):
    client.post("/songs/", json={"name": "a"})
    client.post("/songs/batch", json={"items": [{"name": "b"}]})

    assert client.get("/songs/").json() == []


def test_reading_needs_no_password(client, lock):
    assert client.get("/songs/").status_code == 200
    assert client.get("/config/").status_code == 200


def test_right_password_can_write(client, lock):
    created = client.post("/songs/", json={"name": "晴天"}, headers=lock)
    assert created.status_code == 200

    song_id = created.json()["id"]
    assert client.put(f"/songs/{song_id}", json={"remark": "只唱副歌"}, headers=lock).status_code == 200
    assert client.delete(f"/songs/{song_id}", headers=lock).status_code == 200
