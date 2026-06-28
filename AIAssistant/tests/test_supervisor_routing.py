"""Integration tests for supervisor orchestration (deterministic, no real LLM/Redis).

These build a real supervisor ReAct graph using the production `make_specialist_tool`
wrapper, a scripted tool-calling model, and recording specialist stand-ins. They verify:
  - the supervisor routes to the right specialist(s),
  - the JWT `config` is forwarded into each specialist (and recursion_limit scoped),
  - the supervisor's final message satisfies the AssistantResponse contract.
"""

import json

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from agents.base import SPECIALIST_RECURSION_LIMIT
from agents.supervisor.supervisor import make_specialist_tool
from schemas import AssistantResponse, parse_assistant_response
from tests.fakes import RecordingAgent, ScriptedToolCallingModel

RUN_CONFIG = {"configurable": {"token": "test-jwt", "thread_id": "t1"}}


def _final_json(payload: dict) -> AIMessage:
    return AIMessage(content=json.dumps(payload))


def test_single_domain_routes_to_finance():
    finance = RecordingAgent("Profit last month was 5000.")
    tools = [make_specialist_tool(finance, "finance_agent", "finance")]

    model = ScriptedToolCallingModel(responses=[
        AIMessage(content="", tool_calls=[
            {"name": "finance_agent", "args": {"task": "profit last month"}, "id": "c1"},
        ]),
        _final_json({"visual_response": "Your profit was 5000.",
                     "spoken_response": "Your profit was 5000.", "language_code": "en-IN"}),
    ])
    supervisor = create_react_agent(model=model, tools=tools, prompt="supervisor", checkpointer=None)

    out = supervisor.invoke({"messages": [HumanMessage("What was my profit?")]}, RUN_CONFIG)

    # Routing happened + the JWT propagated into the specialist.
    assert finance.captured_config is not None
    assert finance.captured_config["configurable"]["token"] == "test-jwt"
    assert finance.captured_config["recursion_limit"] == SPECIALIST_RECURSION_LIMIT

    parsed = parse_assistant_response(out["messages"][-1].content)
    assert isinstance(parsed, AssistantResponse)
    assert "5000" in parsed.visual_response


def test_multi_domain_calls_finance_and_inventory():
    finance = RecordingAgent("Profit was 5000.")
    inventory = RecordingAgent("Rice and Sugar are low in stock.")
    tools = [
        make_specialist_tool(finance, "finance_agent", "finance"),
        make_specialist_tool(inventory, "inventory_agent", "inventory"),
    ]

    model = ScriptedToolCallingModel(responses=[
        AIMessage(content="", tool_calls=[
            {"name": "finance_agent", "args": {"task": "profit last month"}, "id": "c1"},
            {"name": "inventory_agent", "args": {"task": "what is low in stock"}, "id": "c2"},
        ]),
        _final_json({"visual_response": "Profit 5000; restock Rice and Sugar.",
                     "spoken_response": "Profit was 5000 and you should restock Rice and Sugar.",
                     "language_code": "en-IN"}),
    ])
    supervisor = create_react_agent(model=model, tools=tools, prompt="supervisor", checkpointer=None)

    out = supervisor.invoke(
        {"messages": [HumanMessage("Profit last month and what to restock?")]}, RUN_CONFIG)

    # Both specialists were delegated to.
    assert finance.captured_config is not None
    assert inventory.captured_config is not None
    parsed = parse_assistant_response(out["messages"][-1].content)
    assert "Rice" in parsed.visual_response and "5000" in parsed.visual_response


def test_specialist_wrapper_returns_error_string_on_failure():
    class Boom:
        def invoke(self, state, config=None):
            raise RuntimeError("kaboom")

    tool = make_specialist_tool(Boom(), "finance_agent", "finance")
    result = tool.invoke({"task": "x"}, config=RUN_CONFIG)
    assert "finance_agent error" in result
    assert "kaboom" in result
