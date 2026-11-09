import logging
from contextlib import contextmanager

from fastapi import HTTPException

logger = logging.getLogger(__name__)


class UserError(Exception):
    """文案可以原样展示给用户的错误，路由层转成 400。

    其他异常（网络错误、上游返回的格式不对等）一律当成上游故障，
    只记日志、回固定文案，不把内部地址和原始报错带给前端。
    """


@contextmanager
def upstream_errors(message: str):
    """包住对外部服务的调用，把出错统一转成给前端的响应。

    UserError 的文案原样返回（400）；其他异常只记日志，回 message 这句固定文案（502）。
    """
    try:
        yield
    except HTTPException:
        raise
    except UserError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception(message)
        raise HTTPException(status_code=502, detail=message)
