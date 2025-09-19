"""
Agent nodes.
When there is a lot of tools that can be grouped together, or a tool is too big
(like tax calculators or staking calculators), only then separate agent is being made.
"""

from langchain_core.messages import AIMessage

from src.agent.prompts import BUSINESS_REQUIREMENTS_DEFINER_PROMPT
from src.agent.tools import *
from src.core.llms import get_llm


def business_analyst_node(state: State, config: RunnableConfig) -> Dict[str, List[AIMessage]]:
    database_schema_context = state.schema_context

    system_message = SystemMessage(content=BUSINESS_REQUIREMENTS_DEFINER_PROMPT.format(
        system_time=datetime.now().isoformat(),
        schema=database_schema_context,
    ))
    llm = get_llm().bind_tools(ba_tools)

    messages = filter_messages(state.messages)
    response = llm.invoke([system_message] + messages)
    return {
        "messages": [response],
    }
