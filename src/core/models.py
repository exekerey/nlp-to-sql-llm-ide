from typing import Literal

from pydantic import BaseModel, Field


class DatabaseCredentials(BaseModel):
    engine: Literal["postgres", "mysql", "clickhouse", "plsql"] = Field(default="postgres")
    host: str = Field(default="aws-1-eu-central-2.pooler.supabase.com")  # validate
    port: int = Field(default=5432)
    username: str = Field(default="postgres.vtgdwpzhujmxurdtngkz")
    password: str = Field(default="postgres")
    database: str = Field(default="chinook")


class Message(BaseModel):
    content: str
    role: Literal["user", "developer", "assistant"]
