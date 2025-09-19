import json
import traceback

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from openai import BaseModel
from sqlalchemy import create_engine, text
from src.agent.graph import graph
from src.agent.langfuse_connection import langfuse_handler
from src.agent.state import State
from src.api.deps import validate_thread_id
from src.core.config import config
from src.core.models import DatabaseCredentials, Message
from src.core.utils import generate_uuid
from src.core.utils import normalize_sql_rows
from src.indexer.index import index_database, construct_db_uri

router = APIRouter(prefix="/v1")


# @router.get("/conversations")


@router.post("/conversation/init")
def init_conversation(credentials: DatabaseCredentials, use_test_db: bool = Query(default=False)):
    if use_test_db:
        credentials = DatabaseCredentials(
            engine=config.test_db_engine,
            host=config.test_db_host,
            port=config.test_db_port,
            username=config.test_db_username,
            password=config.test_db_password,
        )
    thread_id = generate_uuid()
    database_uri = construct_db_uri(credentials)
    database_structure = index_database(database_uri, thread_id)

    if database_structure.startswith("Error:"):
        raise HTTPException(status_code=400, detail={"error": database_structure})

    # The frontend can use this structured data to generate a starter message.
    state_to_save = State(
        database_uri=database_uri,
        database_dialect=credentials.engine,
        schema_context=database_structure,
    )

    graph.invoke(state_to_save, config=RunnableConfig(
        configurable={
            "thread_id": thread_id,
            "recursion_limit": 1,
            "model": "default",
            "init": True,
        },
    ))

    return {
        "thread_id": thread_id,
        "schema": database_structure
    }


class ExecuteSQLRequest(BaseModel):
    query: str


@router.post("/conversation/{thread_id}/sql")
async def execute_sql(req: ExecuteSQLRequest, thread_id: str = Depends(validate_thread_id)):
    query = req.query
    state = graph.invoke({}, config=RunnableConfig(
        configurable={
            "thread_id": thread_id,
            "recursion_limit": 1,
            "model": "default",
            "init": True,
        },
    ))
    engine = create_engine(state['database_uri'])
    with engine.connect() as conn:
        result = conn.execute(text(query))
        rows = result.mappings().all()
        rows = normalize_sql_rows(rows)

    return {
        "query_results": rows,
    }


@router.post("/conversation/{thread_id}")
async def chat(
        msg: Message,
        thread_id: str = Depends(validate_thread_id),
        stream: bool = Query(default=False),
):
    content = msg.content
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
                for stream_type, chunk in graph.stream(
                        {
                            "messages": [HumanMessage(content=content)],
                        },
                        config=cfg,
                        stream_mode=["messages", "values", "custom"]
                ):
                    if stream_type == "custom":
                        event_type = list(chunk.keys())[0]
                        yield preprocess_event({"event": event_type, "data": chunk.get(event_type, "")})
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
                print(e)
                yield preprocess_event({"event": "error", "chat_id": thread_id, "data": "Sorry, an error occurred."})

        return StreamingResponse(stream_response(), media_type="application/x-ndjson")
    extra = {}
    try:
        response = graph.invoke(
            {"messages": [HumanMessage(content=content)]},
            config=cfg,
        )

        extra = {"sql_query": response.get('sql_query'),
                 "rows": response.get('query_results')}
        response_content = response['messages'][-1].content
        status_code = 200

    except Exception as e:
        last = traceback.extract_tb(e.__traceback__)[-1]
        print(last, e)
        response_content = "Sorry, there was an error processing your request."
        status_code = 500

    return JSONResponse({
        "chat_id": thread_id,
        "data": [{
            "role": "assistant",
            "content": response_content,
            **extra,
        }]
    }, status_code=status_code)
