"""Unit tests for inventory_tool and supplier_tool."""

from tests.conftest import FakeResponse
from tools.common import BASE_URL
from tools.inventory_tools import inventory_tool, supplier_tool

inv = inventory_tool.func
sup = supplier_tool.func


def test_inventory_get_all(http, config):
    inv(action="get_all", config=config)
    assert http.last["url"] == f"{BASE_URL}/products"


def test_inventory_low_stock_uses_param(http, config):
    inv(action="get_low_stock", config=config)
    assert http.last["url"] == f"{BASE_URL}/products"
    assert http.last["params"] == {"lowStock": "true"}


def test_inventory_add(http, config):
    payload = {"name": "Rice", "stockQty": 5}
    inv(action="add", product_data=payload, config=config)
    assert http.last["method"] == "post"
    assert http.last["json"] == payload


def test_inventory_invalid_action(http, config):
    result = inv(action="nope", config=config)
    assert result["ok"] is False
    assert http.calls == []


def test_supplier_get_all(http, config):
    sup(action="get_all", config=config)
    assert http.last["url"] == f"{BASE_URL}/supplier"


def test_supplier_search_filters_by_name(http, config):
    http.response = FakeResponse(200, {"status": "success", "data": [
        {"name": "Acme Traders"}, {"name": "Best Wholesale"},
    ]})
    result = sup(action="search", name_search="acme", config=config)
    assert result["ok"] is True
    assert result["data"]["suppliers"] == [{"name": "Acme Traders"}]


def test_supplier_ledger(http, config):
    sup(action="get_ledger", supplier_id="s1", config=config)
    assert http.last["url"] == f"{BASE_URL}/supplier/s1/ledger"
