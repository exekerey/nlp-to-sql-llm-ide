from typing import Literal

from pydantic import BaseModel


class DatabaseCredentials(BaseModel):
    engine: Literal["postgres", "mysql", "clickhouse", "plsql"]
    host: str  # validate
    port: int
    username: str  # should be a secret
    password: str
    database: str


class Message(BaseModel):
    content: str
    role: Literal["user", "developer", "assistant"]
