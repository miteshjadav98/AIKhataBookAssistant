"""Tools package.

Domain tools are split per-specialist (customer/inventory/finance/invoice/support) so each
agent only sees the tools it owns. `get_all_tools()` is kept for backwards compatibility with
the legacy single-agent path (`AGENT_MODE=single`).
"""

from .common import BASE_URL, _err, _ok, get_headers, logged_request
from .customer_tools import customer_tool
from .finance_tools import analytics_tool, payment_tool
from .inventory_tools import inventory_tool, supplier_tool
from .invoice_tools import invoice_tool
from .knowledge_tools import knowledge_search_tool
from .support_tools import create_ticket, get_ticket_status, support_tool, update_ticket

__all__ = [
    "BASE_URL",
    "_ok",
    "_err",
    "get_headers",
    "logged_request",
    "customer_tool",
    "inventory_tool",
    "supplier_tool",
    "analytics_tool",
    "payment_tool",
    "invoice_tool",
    "knowledge_search_tool",
    "support_tool",
    "create_ticket",
    "update_ticket",
    "get_ticket_status",
    "get_all_tools",
]


def get_all_tools():
    """Flat tool list for the legacy single ReAct agent (AGENT_MODE=single)."""
    return [
        customer_tool,
        inventory_tool,
        supplier_tool,
        invoice_tool,
        payment_tool,
        analytics_tool,
        knowledge_search_tool,
        support_tool,
    ]
