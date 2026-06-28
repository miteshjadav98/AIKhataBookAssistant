"""Customer specialist: lookup, ledger analysis, outstanding dues, payment history."""

from agents.base import build_specialist
from prompt_utils import getprompt
from tools.customer_tools import customer_tool
from tools.finance_tools import payment_tool  # shared: customer payments

CUSTOMER_TOOLS = [customer_tool, payment_tool]


def build_customer_agent():
    return build_specialist("customer_agent", CUSTOMER_TOOLS, getprompt("customer_agent_prompt"))
