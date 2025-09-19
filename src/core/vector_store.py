import chromadb
from src.core.embeddings import get_embedding_function
from typing import List, Dict, Any

# Define a path for the persistent storage of the vector store
CHROMA_DB_PATH = "./chroma_db"


def get_chroma_client():
    """
    Initializes and returns a persistent ChromaDB client.
    """
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return client


def get_or_create_collection(collection_name: str):
    """
    Gets or creates a ChromaDB collection with the configured embedding function.

    Args:
        collection_name (str): The name of the collection.

    Returns:
        chromadb.Collection: The collection object.
    """
    client = get_chroma_client()
    embedding_function = get_embedding_function()

    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_function
    )
    return collection


def add_documents(collection_name: str, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str], thread_id: str):
    """
    Adds documents to a specified collection, associating them with a thread_id.

    Args:
        collection_name (str): The name of the collection.
        documents (List[str]): A list of document texts.
        metadatas (List[Dict[str, Any]]): A list of metadata dictionaries for each document.
        ids (List[str]): A list of unique IDs for the documents.
        thread_id (str): The identifier for the user or conversation thread.
    """
    collection = get_or_create_collection(collection_name)

    # Create a copy of the metadatas and add the thread_id to each one
    updated_metadatas = []
    for metadata in metadatas:
        new_meta = metadata.copy()
        new_meta['thread_id'] = thread_id
        updated_metadatas.append(new_meta)

    collection.add(
        documents=documents,
        metadatas=updated_metadatas,
        ids=ids
    )


def query_collection(collection_name: str, query_texts: List[str], thread_id: str, n_results: int = 5) -> Dict[str, Any]:
    """
    Queries a collection to find similar documents, filtered by thread_id.

    Args:
        collection_name (str): The name of the collection.
        query_texts (List[str]): The query texts to search for.
        thread_id (str): The identifier for the user or conversation thread to filter by.
        n_results (int): The number of results to return.

    Returns:
        Dict[str, Any]: The query results.
    """
    collection = get_or_create_collection(collection_name)

    # Use the 'where' filter to scope the search to the given thread_id
    results = collection.query(
        query_texts=query_texts,
        n_results=n_results,
        where={"thread_id": thread_id}
    )
    return results