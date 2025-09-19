from typing import List

from langchain_core.messages import RemoveMessage
from langchain_core.messages import ToolMessage, trim_messages
from langchain_core.messages.utils import count_tokens_approximately
from langchain_core.runnables import RunnableLambda, RunnableConfig
from langgraph.config import get_stream_writer
from langgraph.constants import END
from langgraph.prebuilt import ToolNode, tools_condition
from src.agent.state import State
from src.core.config import config
from src.core.models import SQLUpdate


def handle_tool_error(state) -> dict:
    error = state.get("error")
    tool_calls = state.messages[-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n. Fix your mistakes and retry if it is your fault.",
                # Otherwise return that you have technical issues if it's not your fault todo.
                # tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }


def create_tool_node_with_masking_and_fallback(tools: list):
    tool_node = ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)]
    )

    def run(state: State):
        tool_call_msg = state.messages[-1]
        writer = get_stream_writer()
        for invocation in tool_call_msg.tool_calls:
            function_args = invocation['args']
            if event_message := function_args.get('event_message'):
                writer({"internal": event_message})

        state.messages[-1].tool_calls = [tc for tc in state.messages[-1].tool_calls if
                                         tc['name'] != retrieve_tools.name]

        # state.messages.append(hash_unmasking(state.hash_to_mask_dict, tool_call)) # no need to unmask.
        state_change = tool_node.invoke(state)
        tool_results = state_change['messages']
        for i in range(len(tool_results)):
            tool_results[i].content = "Here is the result of the tool: " + tool_results[
                i].content  # kinda hacky way to prompt. TODO

        mask_to_hash_dict, hash_to_mask_dict, tool_results_masked = hash_masking(
            tool_results, state.mask_to_hash_dict, state.hash_to_mask_dict)
        return {
            "hash_to_mask_dict": hash_to_mask_dict,
            "mask_to_hash_dict": mask_to_hash_dict,
            "messages": tool_results_masked
        }

    return RunnableLambda(run)


def filter_messages(messages: List) -> list:
    # todo: can make filtering of messages that always repeat:
    # - host agent mid instructions - can be deleted after fist occurrence

    new_messages = trim_messages(
        messages,
        max_tokens=config.context_token_limit,
        strategy="last",
        token_counter=count_tokens_approximately,
        include_system=True,
        allow_partial=False,
        start_on="human",
        end_on=("human", "tool"),
    )
    return new_messages
    # return messages[-16:]  # last X messages.


def blockchain_input(state: State, config: RunnableConfig):
    input_message = state.messages[-1]
    blockchain = state.conversation_blockchain or config['configurable']['page_blockchain']
    return {}


def route_to_workflow(state: State):  # might be useful for swarm
    """
    If we are in a delegated state, route directly to the appropriate assistant.
    Might be questionable when trying to handle off-topic questions mixed with relevant ones.
    """
    dialog_state = state.dialog_state
    if not dialog_state:
        return "supervisor"
    return dialog_state[-1]


def init_node(state: State, config: RunnableConfig):
    return {
        "sql_query": None,
        "query_results": None
    }


def init_condition(state: State, config: RunnableConfig):
    if config['configurable'].get('init'):
        return END

    state.sql_query = None
    state.query_results = None
    # state.messages = []
    return "business_analyst"
    # return Command(
    #     update=SQLUpdate(**{"sql_query": None, "query_results": None}),
    #     goto="business_analyst"
    # )


def route_llm(
        state: State,
):
    route = tools_condition(state)
    if route == END:
        return END
    tool_calls = state.messages[-1].tool_calls
    # only_retrieval = all(tc["name"] == retrieve_tools.name for tc in tool_calls)
    # if only_retrieval:  # this stuff can't handle multiple calls at the same time though?
    #     return "add_tools_to_context"
    # only_tool_call = all(tc["name"] != retrieve_tools.name for tc in tool_calls)
    # if only_tool_call:
    #     return "tools"
    if tool_calls:
        return "business_analyst_tools"
    return END


def delete_messages(state):
    messages = state["messages"]
    if len(messages) > 2:
        # remove the earliest two messages
        return {"messages": [RemoveMessage(id=m.id) for m in messages[:2]]}
    return {}
