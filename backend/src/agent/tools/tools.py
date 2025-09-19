import logging
from datetime import datetime
from typing import Annotated

from httpx import AsyncClient
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langfuse import Langfuse
from langgraph.prebuilt import InjectedState
from sqlalchemy import create_engine, text

from backend.src.agent.nodes.util_nodes import filter_messages
from backend.src.agent.prompts import DEVELOPER_AGENT_PROMPT
from backend.src.agent.state import State
from backend.src.core.config import config
from backend.src.core.llms import get_llm
from backend.src.core.utils import run_async
from backend.src.core.vector_store import *
from backend.src.core.vector_store import query_collection
from backend.src.indexer.index import SCHEMA_COLLECTION_NAME

logger = logging.getLogger(__name__)

langfuse = Langfuse(public_key=config.langfuse_public_key, secret_key=config.langfuse_secret_key,
                    host=config.langfuse_host, release=config.project_version, environment=config.env)


@tool("search_web", parse_docstring=True)
async def search_web(state: Annotated[State, InjectedState], query: str):
    """
    Search your own knowledge base for latest information.
    Make search query to be optimized for searching and include everything that search engine needs to know to return \
    \rrelevant results.

    Args:
        query (str): rephrased search query

    Returns:
        dict: search results

    """
    # can also use country to suit the results for the locale of the user.
    async with AsyncClient(timeout=3) as client:
        response = await client.get(
            url="https://s.jina.ai",
            params={
                "q": query,
                # "gl": "JP" # location # has limited list though
                # "hl": "kz" # language # has limited list too.
            },
            headers={
                "Authorization": f"Bearer {config.jina_api_key}",
                "Accept": "application/json",
                "X-Respond-With": "no-content",
            }
        )
        try:
            response.raise_for_status()
        except Exception as e:
            logger.exception(e)
    search_results = response.json()['data']
    if search_results is None:
        return []
    return [{"description": r['description'], "date": r.get('date', "no date")} for r in search_results]


@tool
def search_knowledge_base(state: Annotated[State, InjectedState], query: str, event_message: str) -> dict:
    """
    Search your own knowledge base for latest information.
    Make search query to be optimized for searching and include everything that search engine needs to know to return \
    \rrelevant results.

    Args:
        query (str): rephrased search query

    Returns:
        dict: search results
    """
    # in future can have also custom RAG and rerank the search results together from the web too.
    # or make custom indexer but it's a hassle.
    internal_kb_results = []
    return {
        "notice": "rely more on the internal knowledge, than on web results if you have any interlap of topics.",
        "internal_knowledge": internal_kb_results,
        "web_search_results": run_async(search_web(query))
    }


@tool("delegate_to_database_administrator", parse_docstring=True)
def delegate_to_database_administrator(state: Annotated[State, InjectedState], runnable_config: RunnableConfig,
                                       sql_query_requirements: str) -> Dict[str, Dict]:
    """
    Delegate to database administrator agent to create an SQL to match the needs of users.

    Args:
        sql_query_requirements (str): Compiled requirements to what SQL query should be generated.

    Returns:
        Either reason why it couldn't make an SQL query or SQL query itself.
    """
    database_uri = state.database_uri
    dialect = state.database_dialect
    engine = create_engine(database_uri)
    database_schema = state.schema_context
    error = None
    for _ in range(config.sql_generation_max_iterations):
        system_message = SystemMessage(content=DEVELOPER_AGENT_PROMPT.format(
            system_time=datetime.now().isoformat(),
            requirements=sql_query_requirements,
            dialect=dialect,
            schema=database_schema,
            previous_steps_errors=error
        ))

        llm = get_llm().bind_tools([]).with_structured_output(method="json_mode")
        messages = filter_messages(state.messages)
        payload = llm.invoke([system_message] + messages)

        if payload.get('mismatch'):
            return f"Failed to generate SQL query, resposne from DBA: {payload['mismatch']}"

        sql = payload.get('sql_query')
        try:
            with engine.connect() as conn:
                result = conn.execute(text(sql))
                rows = result.fetchall()
        except Exception as e:
            print(e)
            error = str(e)
            continue
        payload.update({"query_results": rows})
        return payload

    return "Sorry, DBA couldn't generate a valid query for your request"


@tool
def retrieve_schema_details(query: str, thread_id: str) -> str:
    """
    Use this tool to retrieve specific details about the database schema, such as
    columns in a table, data types, primary keys, or foreign key relationships.
    Provide a natural language query about what you want to know.

    For example:
    - "What are the columns in the 'users' table?"
    - "Show me details about the 'orders' table."
    - "What is the relationship between the users and orders tables?"
    """

    results = query_collection(
        collection_name=SCHEMA_COLLECTION_NAME,
        query_texts=[query],
        thread_id=thread_id,
        n_results=3  # Return the top 3 most relevant schema parts
    )

    if not results or not results.get("documents"):
        return "No relevant schema details found for that query."

    # Format the results into a single string for the LLM
    context_str = "\n---\n".join(results["documents"][0])
    return f"Here are the most relevant schema details found:\n{context_str}"
