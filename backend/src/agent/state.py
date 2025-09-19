"""Define the state structures for the agent."""

from __future__ import annotations

from typing import Sequence

from langchain_core.messages import AnyMessage
from langgraph.graph import add_messages
from pydantic import ConfigDict, BaseModel, Field
from typing_extensions import Annotated


class State(BaseModel):
    messages: Annotated[Sequence[AnyMessage], add_messages] = Field(
        default_factory=list
    )

    database_uri: str
    database_dialect: str
    schema_context: str

    model_config = ConfigDict(validate_assignment=True)


def merge_update(old, new):
    m = dict(old)
    m.update(new)
    return m
