"""Unit tests: specialists build offline and own the correct tools."""

from agents.customer import CUSTOMER_TOOLS, build_customer_agent
from agents.finance import FINANCE_TOOLS, build_finance_agent
from agents.inventory import INVENTORY_TOOLS, build_inventory_agent
from agents.invoice import INVOICE_TOOLS, build_invoice_agent
from agents.support import SUPPORT_TOOLS, build_support_agent


def _names(tools):
    return sorted(t.name for t in tools)


def test_finance_tools():
    assert _names(FINANCE_TOOLS) == ["analytics_tool", "payment_tool"]


def test_inventory_tools():
    assert _names(INVENTORY_TOOLS) == ["inventory_tool", "supplier_tool"]


def test_customer_tools():
    assert _names(CUSTOMER_TOOLS) == ["customer_tool", "payment_tool"]


def test_invoice_tools():
    assert _names(INVOICE_TOOLS) == ["invoice_tool"]


def test_support_tools():
    assert _names(SUPPORT_TOOLS) == ["knowledge_search_tool", "support_tool"]


def test_specialists_build_with_names():
    assert build_finance_agent().name == "finance_agent"
    assert build_inventory_agent().name == "inventory_agent"
    assert build_customer_agent().name == "customer_agent"
    assert build_invoice_agent().name == "invoice_agent"
    assert build_support_agent().name == "support_agent"


def test_supervisor_constructs_with_five_specialists():
    from agents.supervisor.supervisor import build_specialist_tools, build_supervisor

    tools = build_specialist_tools()
    assert _names(tools) == [
        "customer_agent",
        "finance_agent",
        "inventory_agent",
        "invoice_agent",
        "support_agent",
    ]
    # Construction must not require Redis connectivity or a live LLM.
    assert build_supervisor().name == "supervisor"
