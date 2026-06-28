"""Unit tests for invoice_tool (sales & purchases)."""

from tools.common import BASE_URL
from tools.invoice_tools import invoice_tool

inv = invoice_tool.func


def test_sale_get_all(http, config):
    inv(action="get_all", type="sale", config=config)
    assert http.last["url"] == f"{BASE_URL}/sales"


def test_purchase_get_all(http, config):
    inv(action="get_all", type="purchase", config=config)
    assert http.last["url"] == f"{BASE_URL}/purchase"


def test_sale_get_todays_uses_date_param(http, config):
    inv(action="get_todays", type="sale", config=config)
    assert http.last["url"] == f"{BASE_URL}/sales"
    assert http.last["params"] == {"date": "today"}


def test_sale_add(http, config):
    payload = {"customerId": "c1", "items": [], "paidAmount": 0}
    inv(action="add", type="sale", invoice_data=payload, config=config)
    assert http.last["method"] == "post"
    assert http.last["url"] == f"{BASE_URL}/sales"
    assert http.last["json"] == payload


def test_purchase_update_is_rejected(http, config):
    result = inv(action="update", type="purchase", invoice_id="p1",
                 invoice_data={"x": 1}, config=config)
    assert result["ok"] is False
    assert http.calls == []  # never hits the API


def test_invalid_action(http, config):
    result = inv(action="nope", type="sale", config=config)
    assert result["ok"] is False
    assert http.calls == []
