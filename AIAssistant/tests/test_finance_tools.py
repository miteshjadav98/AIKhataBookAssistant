"""Unit tests for payment_tool and analytics_tool (Finance domain)."""

from tools.common import BASE_URL
from tools.finance_tools import analytics_tool, payment_tool

pay = payment_tool.func
ana = analytics_tool.func


def test_payment_get_all(http, config):
    pay(action="get_all", config=config)
    assert http.last["method"] == "get"
    assert http.last["url"] == f"{BASE_URL}/payment"


def test_payment_add(http, config):
    payload = {"type": "CUSTOMER_PAYMENT", "customerId": "c1", "amount": 100}
    pay(action="add", payment_data=payload, config=config)
    assert http.last["method"] == "post"
    assert http.last["json"] == payload


def test_payment_invalid_action(http, config):
    result = pay(action="bogus", config=config)
    assert result["ok"] is False
    assert http.calls == []


def test_analytics_dashboard(http, config):
    ana(action="get_dashboard", config=config)
    assert http.last["url"] == f"{BASE_URL}/dashboard"


def test_analytics_invalid_action(http, config):
    result = ana(action="nope", config=config)
    assert result["ok"] is False
    assert http.calls == []
