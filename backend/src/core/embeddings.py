import os
from backend.src.core.config import config

# A cache for the embedding function to avoid re-initializing it every time.
_embedding_function_cache = None


def _get_openai_embedding_function():
    """
    Returns an instance of the OpenAI Embedding Function.
    """
    try:
        from chromadb.utils import embedding_functions
    except ImportError:
        raise ImportError("The 'chromadb' library is required. Please install it with 'pip install chromadb'.")

    api_key = os.getenv("OPENAI_API_KEY") or getattr(config, 'openai_api_key', None)
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables or config.")

    return embedding_functions.OpenAIEmbeddingFunction(
        api_key=api_key,
        model_name="text-embedding-3-large"
    )


def _get_qwen_embedding_function():
    """
    Lazily loads and returns an instance of the SentenceTransformer
    Embedding Function for a Qwen model.
    """
    # Lazy import: only import sentence_transformers if it's actually needed.
    try:
        from chromadb.utils import embedding_functions
    except ImportError:
        raise ImportError("The 'sentence-transformers' library is required. Please install it with 'pip install sentence-transformers'.")

    # Using a high-performing Qwen embedding model. This can be changed in config.
    model_name = getattr(config, 'qwen_model_name', 'Qwen/Qwen3-Embedding-0.6B')

    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=model_name
    )


def get_embedding_function():
    """
    Factory function to get the configured embedding function.
    It loads the function lazily and caches it.

    The embedding model is chosen based on `config.embedding_model`.
    Supported values: 'openai', 'qwen'. Defaults to 'openai'.
    """
    global _embedding_function_cache

    if _embedding_function_cache is not None:
        return _embedding_function_cache

    embedding_model_name = getattr(config, 'embedding_model', 'openai').lower()

    if embedding_model_name == 'openai':
        _embedding_function_cache = _get_openai_embedding_function()
    elif embedding_model_name == 'qwen':
        _embedding_function_cache = _get_qwen_embedding_function()
    else:
        raise ValueError(f"Unsupported embedding model in config: '{embedding_model_name}'. Supported: 'openai', 'qwen'.")

    return _embedding_function_cache