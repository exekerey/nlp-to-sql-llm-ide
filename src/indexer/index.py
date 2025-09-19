from sqlalchemy import create_engine, MetaData
from src.core.models import DatabaseCredentials
from src.core.vector_store import add_documents
from src.core.llms import get_llm
from typing import List, Dict, Any

# Define a constant for the collection name for schema details
SCHEMA_COLLECTION_NAME = "database_schema_details"


def build_connection_string(credentials: DatabaseCredentials) -> str:
    """
    Builds a SQLAlchemy connection string from a DatabaseCredentials object.
    """
    dialect_map = {
        "postgres": "postgresql+psycopg",
        "mysql": "mysql+pymysql",
        "clickhouse": "clickhouse+native",
        "plsql": "oracle+oracledb",
    }
    dialect_part = dialect_map.get(credentials.engine)
    if not dialect_part:
        raise ValueError(f"Unsupported database engine: {credentials.engine}")
    return f"{dialect_part}://{credentials.username}:{credentials.password}@{credentials.host}:{credentials.port}/{credentials.database}"


def _create_schema_documents(metadata: MetaData) -> (List[str], List[Dict[str, Any]], List[str]):
    """Creates structured documents from the database schema for vector store indexing."""
    docs, metadatas, ids = [], [], []

    for table_name, table in metadata.tables.items():
        doc_content = f"Table name: {table_name}\n"
        doc_content += "Columns:\n"
        for column in table.columns:
            col_info = f"- {column.name} (type: {column.type})"
            if column.primary_key:
                col_info += " [PRIMARY KEY]"
            if column.foreign_keys:
                fk = next(iter(column.foreign_keys))
                col_info += f" (references {fk.column.table.name}.{fk.column.name})"
            doc_content += col_info + "\n"

        docs.append(doc_content)
        metadatas.append({"table_name": table_name})
        ids.append(f"table_{thread_id}_{table_name}")

    return docs, metadatas, ids


def _summarize_schema_with_llm(schema_string: str) -> str:
    """Uses an LLM to generate a high-level summary of the database schema."""
    llm = get_llm()

    prompt = f"""
    Based on the following database schema, please provide a concise, high-level summary.
    Focus on the main entities and their relationships. Do not describe every single column.
    The summary should be a single paragraph that can be used as context for another AI.

    Schema:
    ---
    {schema_string}
    ---
    Summary:
    """

    response = llm.invoke(prompt)
    return response.content


def index_database(credentials: DatabaseCredentials, thread_id: str) -> str:
    """
    Connects to a database, indexes its schema into a vector store,
    and returns a high-level summary for the agent's context.
    """
    try:
        connection_string = build_connection_string(credentials)
        engine = create_engine(connection_string)
        metadata = MetaData()
        metadata.reflect(bind=engine)
    except Exception as e:
        return f"Error: Could not reflect database schema. Details: {e}"

    if not metadata.tables:
        return "No tables found in the database."

    # 1. Create documents for the vector store
    docs, metadatas, ids = _create_schema_documents(metadata)

    # 2. Add documents to the vector store, scoped by thread_id
    add_documents(
        collection_name=SCHEMA_COLLECTION_NAME,
        documents=docs,
        metadatas=metadatas,
        ids=ids,
        thread_id=thread_id
    )

    # 3. Generate a high-level summary for the LLM context
    schema_string_for_summary = "\n\n".join(docs)
    summary = _summarize_schema_with_llm(schema_string_for_summary)

    return summary