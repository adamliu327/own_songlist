"""跨域：只放行配置里的来源（测试里是 http://localhost:30426）。"""

OURS = "http://localhost:30426"
OTHER = "https://evil.example"


def test_other_origins_get_no_cors_headers(client):
    response = client.get("/songs/", headers={"Origin": OTHER})

    assert "access-control-allow-origin" not in response.headers
    assert "access-control-allow-credentials" not in response.headers


def test_preflight_from_other_origins_is_refused(client):
    response = client.options("/songs/x", headers={"Origin": OTHER, "Access-Control-Request-Method": "DELETE"})

    assert response.status_code == 400


def test_our_origin_may_send_the_password_header(client):
    response = client.options(
        "/config/",
        headers={
            "Origin": OURS,
            "Access-Control-Request-Method": "DELETE",
            "Access-Control-Request-Headers": "x-edit-password",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == OURS
    assert "x-edit-password" in response.headers["access-control-allow-headers"].lower()
    # 接口不用 cookie，不该声明允许带凭据
    assert "access-control-allow-credentials" not in response.headers
