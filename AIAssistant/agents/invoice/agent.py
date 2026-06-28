"""Invoice specialist: invoice creation, retrieval, and updates (sales & purchases)."""

from agents.base import build_specialist
from prompt_utils import getprompt
from tools.invoice_tools import invoice_tool

INVOICE_TOOLS = [invoice_tool]


def build_invoice_agent():
    return build_specialist("invoice_agent", INVOICE_TOOLS, getprompt("invoice_agent_prompt"))
