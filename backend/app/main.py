from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import get_settings
from app.routers import auth, search, songs, config, compare, playlist_import, lyric

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

# 接口不用 cookie，不需要 allow_credentials；开着的话配成 * 时等于对所有网站放行带凭据的请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(songs.router, prefix="/songs", tags=["songs"])
app.include_router(config.router, prefix="/config", tags=["config"])
app.include_router(compare.router, prefix="/compare", tags=["compare"])
app.include_router(playlist_import.router, prefix="/import", tags=["import"])
app.include_router(lyric.router, prefix="/lyric", tags=["lyric"])


@app.get("/")
def root():
    return {"message": "Songlist API"}
