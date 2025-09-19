from langfuse.callback import CallbackHandler

from src.core.config import config

langfuse_handler = CallbackHandler(
    version=config.project_version,
    public_key=config.langfuse_public_key,
    secret_key=config.langfuse_secret_key,
    host=config.langfuse_host,
    threads=config.langfuse_threads,
    flush_at=config.langfuse_batch_size,
    environment=config.env,
)

if config.env == "prod":
    try:
        langfuse_handler.auth_check()
    except Exception as e:
        raise ConnectionError("Can't connect to LangFuse instance")
