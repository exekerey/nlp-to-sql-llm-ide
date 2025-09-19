"""Utility & helper functions."""
import asyncio
import base64
import datetime
import json
import threading
import uuid
from datetime import datetime
from decimal import Decimal
from decimal import getcontext

from httpx import HTTPError
from langchain_core.messages import BaseMessage

_loop = None

getcontext().prec = 30


def normalize_sql_rows(rows):
    def clean_value(v):
        if isinstance(v, Decimal):
            return int(v) if v == v.to_integral_value() else float(v)
        if isinstance(v, (datetime.date, datetime.datetime, datetime.time)):
            return v.isoformat()
        if isinstance(v, uuid.UUID):
            return str(v)
        if isinstance(v, (bytes, bytearray)):
            return base64.b64encode(v).decode()
        if isinstance(v, dict):
            return {k: clean_value(val) for k, val in v.items()}
        if isinstance(v, (list, tuple)):
            return [clean_value(val) for val in v]
        return v

    out = []
    for row in rows:
        # RowMapping behaves like a dict
        d = dict(row)
        out.append({k: clean_value(v) for k, v in d.items()})
    return out


def raise_for_status_informative(response):
    if response.status_code == 200:
        return

    default_error_msg = "There was some error on the server and it's not your fault."
    try:
        error_msg = response.json()['data']
        if not isinstance(error_msg, str):
            error_msg = default_error_msg
    except (json.JSONDecodeError, KeyError):
        error_msg = default_error_msg

    raise HTTPError(error_msg)


def get_message_text(msg: BaseMessage) -> str:
    """Get the text content of a message."""
    content = msg.content
    if isinstance(content, str):
        return content
    elif isinstance(content, dict):
        return content.get("text", "")
    else:
        txts = [c if isinstance(c, str) else (c.get("text") or "") for c in content]
        return "".join(txts).strip()


def _start_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()


def run_async(coro):
    global _loop
    if _loop is None:
        loop = asyncio.new_event_loop()
        t = threading.Thread(target=_start_loop, args=(loop,), daemon=True)
        t.start()
        _loop = loop
    future = asyncio.run_coroutine_threadsafe(coro, _loop)
    return future.result()


def reformat_time(time_string: str) -> str:
    timestamp = datetime.strptime(time_string, "%Y-%m-%dT%H:%M:%S.%fZ")
    return timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_uuid():
    return str(uuid.uuid4())
