from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import get_settings
from app.routers import search, songs, config, compare, playlist_import

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

origins = [origin.strip() for origin in settings.cors_origins.split(",")] if settings.cors_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(songs.router, prefix="/songs", tags=["songs"])
app.include_router(config.router, prefix="/config", tags=["config"])
app.include_router(compare.router, prefix="/compare", tags=["compare"])
app.include_router(playlist_import.router, prefix="/import", tags=["import"])


@app.get("/")
def root():
    return {"message": "Songlist API"}
