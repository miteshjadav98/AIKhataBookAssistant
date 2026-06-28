"""Inventory specialist: product lookup, stock, low-stock alerts, restocking, suppliers."""

from agents.base import build_specialist
from prompt_utils import getprompt
from tools.inventory_tools import inventory_tool, supplier_tool

INVENTORY_TOOLS = [inventory_tool, supplier_tool]


def build_inventory_agent():
    return build_specialist("inventory_agent", INVENTORY_TOOLS, getprompt("inventory_agent_prompt"))
