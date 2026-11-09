from typing import Optional

from fastapi import APIRouter, Header

from app.auth import password_ok
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/status")
def auth_status(x_edit_password: Optional[str] = Header(None)):
    """是否启用了编辑锁，以及请求带的密码对不对。前端用它决定显示解锁入口，也用它验证密码。"""
    return {"required": bool(settings.password), "unlocked": password_ok(x_edit_password)}
