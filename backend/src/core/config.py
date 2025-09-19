from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Config(BaseSettings):
    env: Literal["dev", "prod"]
    port: int
    project_version: str = "v0.0.0"

    # apis.llms
    openai_api_key: str
    cerebras_api_key: str

    llm_max_retries: int = 2
    llm_timeout: int = 10

    jina_api_key: str

    # test db
    test_db_engine: str
    test_db_host: str
    test_db_port: int
    test_db_username: str
    test_db_password: str

    # langfuse
    langfuse_host: str
    langfuse_public_key: str
    langfuse_secret_key: str
    langfuse_threads: int = 4
    langfuse_batch_size: int

    # internal
    sql_generation_max_iterations: int = 3
    default_llm_model: str = "gpt-4.1"
    context_token_limit: int = 64_128


config = Config(_env_file=Path(__file__).parents[3] / ".env", )  # noqa
