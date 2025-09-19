import json

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from src.agent.graph import graph
from src.agent.langfuse_connection import langfuse_handler
from src.api.deps import validate_thread_id
from src.core.models import DatabaseCredentials, Message
from src.core.utils import generate_uuid
from src.indexer.index import index_database

router = APIRouter()


# @router.get("/conversations")


@router.post("/conversation/init")
def init_conversation(credentials: DatabaseCredentials):
    thread_id = generate_uuid()
    database_structure = index_database(credentials, thread_id)

    if database_structure.startswith("Error:"):
        raise HTTPException(status_code=400, detail={"error": database_structure})

    # The frontend can use this structured data to generate a starter message.
    return {
        "thread_id": thread_id,
        "schema": database_structure
    }


@router.post("/conversation/{chat_id}")
def chat(msg: Message):
    return {
        "sql_query": "SELECT 1",
        "explanation": "asdf",
        "results": ["1"]
    }


class ChatRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000, alias="message")


#
# @router.get("")
# async def get_chat(thread_id: str = Depends(validate_thread_id)):
#     with get_db_connection() as conn:
#         return {
#             "chat_id": thread_id,
#             "data": get_conversation(conn, thread_id)
#         }

@router.post("")
async def chat(
        req: ChatRequest,
        thread_id: str = Depends(validate_thread_id),
        stream: bool = Query(default=False),
):
    content = req.content
    cfg = RunnableConfig(
        configurable={
            "thread_id": thread_id,
            "recursion_limit": 1,
            "model": "default",
        },
        callbacks=[langfuse_handler],
        metadata={"langfuse_session_id": thread_id},
    )
    if stream:
        def preprocess_event(event):
            return (json.dumps(event, ensure_ascii=False) + "\n").encode()

        def stream_response():
            yield preprocess_event({"event": "start", "chat_id": thread_id})
            try:
                for stream_type, chunk in graph.graph.stream(
                        {
                            "messages": [HumanMessage(content=content)],
                        },
                        config=cfg,
                        stream_mode=["messages", "values", "custom"]
                ):
                    if stream_type == "custom":
                        yield preprocess_event({"event": "internal", "data": chunk.get("internal", "")})
                        continue
                    if stream_type == "values":
                        continue
                    if chunk[0].additional_kwargs or not isinstance(chunk[0], AIMessage):
                        continue
                    token = chunk[0].content
                    if not token: continue
                    if isinstance(token, list):  # anthropic tokens preprocessing
                        print(token)
                        assert len(token) == 1
                        if token[0]['type'] != "text":
                            continue
                        token = token[0]['text']
                    yield preprocess_event({"event": "content", "data": token})
                yield preprocess_event({"event": "end", "chat_id": thread_id})
            except Exception as e:
                yield preprocess_event({"event": "error", "chat_id": thread_id, "data": "Sorry, an error occurred."})

        return StreamingResponse(stream_response(), media_type="application/x-ndjson")

    try:
        response = graph.graph.invoke(
            {"messages": [HumanMessage(content=content)]},
            config=cfg,
        )
        response_content = response['messages'][-1].content
        status_code = 200

    except Exception as e:
        response_content = "Sorry, there was an error processing your request."
        status_code = 500

    return JSONResponse({
        "chat_id": thread_id,
        "data": [{
            "role": "assistant",
            "content": response_content
        }]
    }, status_code=status_code)
