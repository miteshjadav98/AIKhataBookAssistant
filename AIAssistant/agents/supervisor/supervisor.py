"""Supervisor agent (agents-as-tools orchestration).

The supervisor is itself a ReAct agent whose "tools" are the specialist sub-agents. It
classifies intent, delegates to one or more specialists, and aggregates their plain-text
findings into the single final JSON contract the frontend expects.

Key design points:
- Only the supervisor holds the Redis checkpointer (conversation memory). Specialists are
  invoked fresh per delegation.
- Each specialist wrapper forwards the supervisor's run `config` (which carries the JWT in
  `configurable.token`) down to the specialist, so the specialist's domain tools stay
  authenticated. We only override `recursion_limit` to bound the sub-agent's own loop.
"""

from langchain_core.messages import HumanMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base import SPECIALIST_RECURSION_LIMIT
from agents.customer import build_customer_agent
from agents.finance import build_finance_agent
from agents.inventory import build_inventory_agent
from agents.invoice import build_invoice_agent
from agents.support import build_support_agent
from checkpointer import memory
from llm import build_chat_llm
from prompt_utils import getprompt


def make_specialist_tool(agent, name: str, description: str):
    """Wrap a compiled specialist agent as a LangChain tool the supervisor can call.

    `task` is the natural-language instruction the supervisor hands to the specialist.
    The current run `config` (with the JWT token) is forwarded so the specialist's tools
    stay authenticated; only the recursion limit is scoped down for the sub-call.
    """

    @tool(name, description=description)
    def _specialist_tool(task: str, config: RunnableConfig = None) -> str:
        sub_config = dict(config or {})
        sub_config["recursion_limit"] = SPECIALIST_RECURSION_LIMIT
        try:
            result = agent.invoke({"messages": [HumanMessage(content=task)]}, sub_config)
        except Exception as e:  # noqa: BLE001 - return a clean message so one failure doesn't crash the turn
            return f"[{name} error] {e}"
        messages = result.get("messages") if isinstance(result, dict) else None
        if not messages:
            return f"[{name}] produced no output."
        return messages[-1].content or f"[{name}] produced an empty response."

    return _specialist_tool


_SPECIALIST_SPECS = [
    (
        build_finance_agent,
        "finance_agent",
        "Delegate revenue, profit, expense, dues, dashboard-metric, and payment-recording tasks. "
        "Pass a clear natural-language `task`.",
    ),
    (
        build_inventory_agent,
        "inventory_agent",
        "Delegate product lookup, stock levels, low-stock / restocking, supplier info, and "
        "product-name-to-UUID/price resolution. Pass a clear natural-language `task`.",
    ),
    (
        build_customer_agent,
        "customer_agent",
        "Delegate customer lookup, ledgers, outstanding dues, payment history, and "
        "customer-name-to-UUID resolution. Pass a clear natural-language `task`.",
    ),
    (
        build_invoice_agent,
        "invoice_agent",
        "Delegate creating / retrieving / updating sales & purchase invoices. Provide already-resolved "
        "UUIDs and prices in the `task`; only ask it to create after the user has confirmed.",
    ),
    (
        build_support_agent,
        "support_agent",
        "Delegate operational issues and support tickets (payment not reflected, printer/app problems, "
        "login issues, feature requests). Pass a clear natural-language `task`.",
    ),
]


def build_specialist_tools():
    """Build and wrap all specialist agents as supervisor tools."""
    return [make_specialist_tool(build(), name, desc) for build, name, desc in _SPECIALIST_SPECS]


def build_supervisor():
    """Build the compiled supervisor graph (with Redis thread memory)."""
    llm = build_chat_llm(temperature=0)
    tools = build_specialist_tools()
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=getprompt("supervisor_prompt"),
        checkpointer=memory,
        name="supervisor",
    )
