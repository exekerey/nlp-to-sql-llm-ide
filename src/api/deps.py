import uuid

from fastapi import Path, HTTPException


def validate_thread_id(
        thread_id: str = Path(example="some uuid4 string")) -> str:
    try:
        val = uuid.UUID(thread_id, version=4)
        if val.version != 4:
            raise HTTPException(status_code=400, detail="Please init convo first")
        return thread_id
    except ValueError:
        raise HTTPException(status_code=400, detail="Please init convo first")
