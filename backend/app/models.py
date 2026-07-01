import uuid
from sqlalchemy import Column, String, Text, DateTime, func
from app.database import Base


class Song(Base):
    __tablename__ = "songs"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    singer = Column(String(255), index=True)
    language = Column(String(50), index=True)
    style = Column(String(50), index=True)
    remark = Column(Text)
    cover = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Config(Base):
    __tablename__ = "config"

    key = Column(String(50), primary_key=True)
    value = Column(Text)
