"""Factory for a specialist ReAct sub-agent.

A specialist is a plain `create_react_agent` with a focused tool set and a domain prompt.
It is deliberately created **without a checkpointer**: specialists are invoked fresh by the
supervisor on each delegation (they receive the task as their only input message and return
findings), so conversation memory lives solely at the supervisor level.
"""

from langgraph.prebuilt import create_react_agent

from llm import build_chat_llm

# Bound a specialist's internal tool-call loop so a confused sub-agent can't spin forever.
import os

SPECIALIST_RECURSION_LIMIT = int(os.getenv("SPECIALIST_RECURSION_LIMIT", "8"))


def build_specialist(name: str, tools: list, prompt: str):
    """Create a compiled ReAct specialist agent (no checkpointer, temperature 0)."""
    llm = build_chat_llm(temperature=0)
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=prompt,
        name=name,
    )
