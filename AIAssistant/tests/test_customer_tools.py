"""Unit tests for customer_tool (routing to the right backend endpoint)."""

from tests.conftest import FakeResponse
from tools.common import BASE_URL
from tools.customer_tools import customer_tool

# customer_tool is a LangChain StructuredTool; .func is the underlying callable.
call = customer_tool.func


def test_get_all(http, config):
    call(action="get_all", config=config)
    assert http.last["method"] == "get"
    assert http.last["url"] == f"{BASE_URL}/customers"
    assert http.last["headers"] == {"Authorization": "Bearer test-jwt"}


def test_get_by_id(http, config):
    call(action="get_by_id", customer_id="c1", config=config)
    assert http.last["url"] == f"{BASE_URL}/customers/c1"


def test_search_uses_query_param(http, config):
    call(action="search", name_search="rahul", config=config)
    assert http.last["url"] == f"{BASE_URL}/customers"
    assert http.last["params"] == {"search": "rahul"}


def test_add_posts_payload(http, config):
    payload = {"name": "Rahul", "password": "cust123"}
    call(action="add", customer_data=payload, config=config)
    assert http.last["method"] == "post"
    assert http.last["json"] == payload


def test_get_ledger_combines_sales_and_payments(http, config):
    http.response = FakeResponse(200, {"status": "success", "data": []})
    result = call(action="get_ledger", customer_id="c1", config=config)
    # Two calls: sales (filtered) then payments.
    assert [c["url"] for c in http.calls] == [f"{BASE_URL}/sales", f"{BASE_URL}/payment"]
    assert result["ok"] is True
    assert set(result["data"].keys()) == {"sales", "payments"}


def test_invalid_action_makes_no_request(http, config):
    result = call(action="frobnicate", config=config)
    assert result["ok"] is False
    assert http.calls == []
