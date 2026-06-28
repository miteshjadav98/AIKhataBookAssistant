import os

from langgraph.prebuilt import create_react_agent

from checkpointer import memory  # shared Redis-backed thread memory
from llm import build_chat_llm
from prompt_utils import getprompt
from schemas import AssistantResponse
from tools import get_all_tools

SYSTEM_PROMPT = getprompt("system_prompt")


def create_shopkeeper_agent():
    """Legacy single ReAct agent (all tools, one prompt).

    Kept as a one-env-var rollback path: set AGENT_MODE=single to use this instead of the
    multi-agent supervisor.
    """
    # Switchable backend: LLM_BACKEND=ollama (default) or azure.
    llm = build_chat_llm(temperature=0)

    tools = get_all_tools()

    # Optional: enforce structured output via the model's schema/tool-calling support.
    # Off by default — enable with USE_STRUCTURED_OUTPUT=true once verified with your model.
    extra_kwargs = {}
    if os.getenv("USE_STRUCTURED_OUTPUT", "false").lower() == "true":
        extra_kwargs["response_format"] = AssistantResponse

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SYSTEM_PROMPT,
        checkpointer=memory,
        **extra_kwargs,
    )

    return agent


def build_agent():
    """Return the active agent based on AGENT_MODE.

    - "supervisor" (default): the multi-agent Supervisor that delegates to domain specialists.
    - "single": the legacy single ReAct agent (rollback).

    Both expose the same `.invoke(state, config)` interface and return `{"messages": [...]}`
    whose last message is the final JSON response, so the FastAPI layer is unchanged.
    """
    mode = os.getenv("AGENT_MODE", "supervisor").lower()
    if mode == "single":
        print("[agent] AGENT_MODE=single -> legacy single ReAct agent")
        return create_shopkeeper_agent()

    # Imported lazily so the legacy path doesn't pay the specialist import cost.
    from agents.supervisor import build_supervisor

    print("[agent] AGENT_MODE=supervisor -> multi-agent supervisor")
    return build_supervisor()
