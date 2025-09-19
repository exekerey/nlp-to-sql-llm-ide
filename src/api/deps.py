import uuid
from typing import Optional

from fastapi import Header

from src.core.utils import generate_uuid


def validate_thread_id(
        thread_id: Optional[str] = Header(example="some uuid4 string", alias="X-Chat-ID", default=None)) -> str:
    if thread_id is None:
        return generate_uuid()
    try:
        val = uuid.UUID(thread_id, version=4)
        if val.version != 4:
            return generate_uuid()
        return thread_id
    except ValueError:
        return generate_uuid()
