"""歌曲的增删改、批量导入去重，以及设置的读写。"""
from app.database import SessionLocal
from app.models import Song


def test_create_strips_whitespace(client):
    song = client.post("/songs/", json={"name": "  晴天  ", "singer": " 周杰伦 "}).json()

    assert song["name"] == "晴天"
    assert song["singer"] == "周杰伦"


def test_blank_or_oversized_names_are_rejected(client):
    assert client.post("/songs/", json={"name": "   "}).status_code == 422
    assert client.post("/songs/", json={"name": "x" * 501}).status_code == 422
    assert client.get("/songs/").json() == []


def test_update_only_touches_the_fields_that_were_sent(client):
    song_id = client.post("/songs/", json={"name": "晴天", "singer": "周杰伦"}).json()["id"]

    updated = client.put(f"/songs/{song_id}", json={"remark": " 只唱副歌 "}).json()

    assert updated["name"] == "晴天"
    assert updated["singer"] == "周杰伦"
    assert updated["remark"] == "只唱副歌"


def test_update_can_clear_a_field_with_an_empty_string(client):
    song_id = client.post("/songs/", json={"name": "晴天", "remark": "只唱副歌"}).json()["id"]

    assert client.put(f"/songs/{song_id}", json={"remark": ""}).json()["remark"] == ""


def test_update_rejects_a_blank_name(client):
    song_id = client.post("/songs/", json={"name": "晴天"}).json()["id"]

    assert client.put(f"/songs/{song_id}", json={"name": " "}).status_code == 422


def test_update_and_delete_report_missing_songs(client):
    assert client.put("/songs/nope", json={"name": "x"}).status_code == 404
    assert client.delete("/songs/nope").status_code == 404


def test_batch_skips_songs_already_in_the_list(client):
    client.post("/songs/", json={"name": "Love Story", "singer": "Taylor Swift"})

    result = client.post(
        "/songs/batch",
        json={
            "items": [
                # 大小写、空格、全半角不同，算同一首
                {"name": "ＬＯＶＥ story", "singer": "taylor  swift"},
                {"name": "七里香", "singer": "周杰伦"},
                # 同一批里重复出现的也只收一次
                {"name": "七里香", "singer": "周杰伦"},
                # 歌名一样、歌手不同，是另一首
                {"name": "七里香", "singer": "翻唱歌手"},
            ]
        },
    ).json()

    assert result == {"created": 2, "skipped": 2}
    assert len(client.get("/songs/").json()) == 3


def test_list_still_returns_rows_that_break_todays_limits(client):
    """长度限制只管写入。库里已有的超长数据要能原样读出来，不能让整个列表报错。"""
    with SessionLocal() as db:
        db.add(Song(name="x" * 600, singer=None))
        db.commit()

    songs = client.get("/songs/").json()

    assert len(songs) == 1
    assert len(songs[0]["name"]) == 600


def test_config_starts_from_defaults_and_can_be_changed(client):
    assert client.get("/config/").json()["danmaku_template"] == "点歌 {name}"

    changed = client.put("/config/", json={"items": [{"key": "danmaku_template", "value": "点 {name}"}]}).json()

    assert changed["danmaku_template"] == "点 {name}"
    assert client.get("/config/").json()["danmaku_template"] == "点 {name}"


def test_config_rejects_unknown_keys_and_oversized_values(client):
    assert client.put("/config/", json={"items": [{"key": "nope", "value": "x"}]}).status_code == 400
    assert client.put("/config/", json={"items": [{"key": "playlist_name", "value": "x" * 501}]}).status_code == 422


def test_config_reset_is_a_delete(client):
    client.put("/config/", json={"items": [{"key": "playlist_name", "value": "我的"}]})

    assert client.delete("/config/").json()["playlist_name"] == "我的点歌单"
    # 旧的 POST /config/reset 不带请求体，浏览器不发预检，任意网页都能触发，所以去掉了
    assert client.post("/config/reset").status_code in (404, 405)
