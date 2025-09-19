from typing import Optional

from langchain_cerebras import ChatCerebras
from langchain_openai import ChatOpenAI

from src.core.config import config  # noqa

models = {  # not separating by providers but rather by LLMs themselves for possible future comparison.
    "gpt-4.1": ChatOpenAI(  # favorite.
        model="gpt-4.1",
        temperature=0,
        max_retries=0,
        timeout=30,  # p90 + some overhead.
    ),
    "llama-3.3-70b": ChatCerebras(  # bad with tool calls
        model="llama-3.3-70b",
        max_retries=config.llm_max_retries,
        temperature=1,
        timeout=config.llm_timeout,
        streaming=False,
    ),
    "llama-4-scout-17b-16e-instruct": ChatCerebras(  # bad with tool calls
        model="llama-4-scout-17b-16e-instruct",
        temperature=0,
        max_retries=config.llm_max_retries,
        timeout=config.llm_timeout,
    ),
    "qwen-3-32b": ChatCerebras(
        model="qwen-3-32b",
        max_retries=config.llm_max_retries + 1,
        temperature=0,
        timeout=config.llm_timeout + 10,  # overhead for arkham summaries.
        streaming=False,
    )
}


def get_llm(_type: Optional[str] = None):
    llm = models[config.default_llm_model]
    return llm
