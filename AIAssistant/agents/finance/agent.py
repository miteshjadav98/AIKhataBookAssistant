"""Finance specialist: revenue, profit, expenses, payments, financial insights."""

from agents.base import build_specialist
from prompt_utils import getprompt
from tools.finance_tools import analytics_tool, payment_tool

FINANCE_TOOLS = [analytics_tool, payment_tool]


def build_finance_agent():
    return build_specialist("finance_agent", FINANCE_TOOLS, getprompt("finance_agent_prompt"))
