import secrets
from typing import Optional
from urllib.parse import unquote

from fastapi import Header, HTTPException

from app.config import get_settings

settings = get_settings()


def password_ok(header_value: Optional[str]) -> bool:
    """请求头里的密码对不对；没设密码时一律算对。

    请求头里放不了中文，前端用 encodeURIComponent 编码后再发，这里解回来比对。
    """
    if not settings.password:
        return True
    if not header_value:
        return False
    return secrets.compare_digest(unquote(header_value).encode(), settings.password.encode())


def require_unlock(x_edit_password: Optional[str] = Header(None)) -> None:
    """写接口的依赖：启用了编辑锁时，请求头 X-Edit-Password 必须带对密码。"""
    if not password_ok(x_edit_password):
        raise HTTPException(status_code=401, detail="需要先解锁编辑")
