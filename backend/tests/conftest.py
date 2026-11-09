"""测试用的应用和夹具。

应用在导入时就读配置、连数据库，所以环境变量要赶在导入 app 之前设好。
环境变量的优先级高于 backend/.env，本机的开发配置不会影响测试。
"""
import os
import tempfile
from urllib.parse import quote

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp(prefix='songlist-test-')}/test.db"
os.environ["CORS_ORIGINS"] = "http://localhost:30426"
os.environ["PASSWORD"] = ""
# 对外请求都应该由 upstream 夹具接管；漏掉的话也只会打到这两个不存在的地址，不会碰真实服务
os.environ["NETEASE_API_URL"] = "http://netease.test"
os.environ["STARLWR_API_URL"] = "http://starlwr.test"

import httpx  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    """每个测试都从空库开始。"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestClient(app)


@pytest.fixture
def lock(monkeypatch):
    """启用编辑锁，返回带着正确密码的请求头。密码故意带中文、空格和百分号。"""
    password = "测试 pw-1%"
    monkeypatch.setattr(get_settings(), "password", password)
    return {"X-Edit-Password": quote(password, safe="")}


@pytest.fixture
def upstream(monkeypatch):
    """接管后端发出的所有 HTTP 请求。

    用法：``seen = upstream(handler)``。handler 收到 httpx.Request、返回 httpx.Response；
    seen 是实际发出的请求列表，可以用来断言「根本没有发请求」。
    """
    real_client = httpx.AsyncClient

    def install(handler):
        seen: list[httpx.Request] = []

        def record(request: httpx.Request) -> httpx.Response:
            seen.append(request)
            return handler(request)

        monkeypatch.setattr(
            httpx,
            "AsyncClient",
            lambda **kwargs: real_client(transport=httpx.MockTransport(record), **kwargs),
        )
        return seen

    return install
