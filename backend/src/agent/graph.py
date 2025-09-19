import sqlite3

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.constants import END
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import ToolNode
from src.agent.nodes.agent_nodes import *
from src.agent.nodes.util_nodes import route_llm, init_node, init_condition
from src.agent.state import State
from src.core.utils import generate_uuid

conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)
checkpointer = SqliteSaver(conn)
builder = StateGraph(State)

builder.add_node("init_node", init_node)
builder.add_node("business_analyst", business_analyst_node)
builder.add_node("business_analyst_tools", ToolNode(ba_tools))
builder.add_edge("business_analyst_tools", "business_analyst")
builder.add_node("database_administrator", delegate_to_database_administrator)

# builder.add_node("blockchain_input", blockchain_input)

builder.add_edge(START, "init_node")
builder.add_conditional_edges("init_node", init_condition, ["business_analyst", END])

builder.add_conditional_edges(
    "business_analyst",
    route_llm,
    ["database_administrator", "business_analyst_tools", END]
)  # developer agent seems to be a separate tool, rather than next step?

graph = builder.compile(checkpointer=checkpointer)
