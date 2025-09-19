import time

from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import END
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import ToolNode

from src.agent.nodes.agent_nodes import *
from src.agent.nodes.util_nodes import route_llm
from src.agent.state import State
from src.core.utils import generate_uuid

builder = StateGraph(State)

builder.add_node("business_analyst", business_analyst_node)
builder.add_node("business_analyst_tools", ToolNode(ba_tools))

builder.add_edge("business_analyst_tools", "business_analyst")
builder.add_node("database_administrator", database_administrator_node)

# builder.add_node("blockchain_input", blockchain_input)

builder.add_edge(START, "business_analyst")

builder.add_conditional_edges(
    "business_analyst",
    route_llm,
    {"database_administrator": "database_administrator", END: END}
)  # developer agent seems to be a separate tool, rather than next step?


class Graph:
    graph = None

    def build(self):
        checkpointer = MemorySaver()
        self.graph = builder.compile(checkpointer=checkpointer)


graph = Graph()
if __name__ == '__main__':
    graph.build()
    graph = graph.graph
    thread_id = generate_uuid()
    print("thread:", thread_id)

    cfg = RunnableConfig(
        configurable={
            "thread_id": thread_id,
            "recursion_limit": 1,
            "model": "default",
        },
        # callbacks=[langfuse_handler],
        metadata={
            "langfuse_session_id": thread_id,
        })
    test_prompts = {
        "1": "last 3 transactions for vitalik.eth address",
        "2": "resolve ENS: vitalik.eth",
        "3": "resolve ENS: alma.eth",
        "4": "last 100 transactions for vitalik.eth address",
        "5": "find the address that has the biggest USDT holdings amongst addresses in block 22 million",
        # todo: incorrect response on that.
        "6": "address with the biggest holdings of ETH that starts with 0x000 involved in the block 22mil",
        # artificial use-case.
        "w": "get me burnt fee in block 22 mil",
        "e": "miner address of block 800k in bitcoin"
    }
    while True:
        query = input("> ")
        if query == "q":
            break

        if query in test_prompts:
            query = test_prompts[query]
            addition = input("selected prompt: " + query)
            if addition:
                query += addition
        start = time.time()

        for stream_type, chunk in graph.stream(
                {
                    "messages": [HumanMessage(content=query)],
                },
                config=cfg,
                stream_mode=["messages", "values", "custom"]
        ):
            if stream_type == "custom":
                print(chunk)
            if stream_type != "messages":
                continue

            if not chunk or chunk[0].additional_kwargs or not isinstance(chunk[0], AIMessage):
                continue

            print(chunk[0].content, end="", flush=True)
        print()
