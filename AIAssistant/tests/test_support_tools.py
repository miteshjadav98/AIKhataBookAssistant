"""Unit tests for the Support agent's ticket tools."""

from tools.common import BASE_URL
from tools.support_tools import (
    create_ticket,
    get_ticket_status,
    support_tool,
    update_ticket,
)

dispatch = support_tool.func


def test_create_ticket_posts(http, config):
    data = {"category": "PAYMENT", "priority": "HIGH", "issueSummary": "Not reflected"}
    create_ticket(data, config)
    assert http.last["method"] == "post"
    assert http.last["url"] == f"{BASE_URL}/support/tickets"
    assert http.last["json"] == data
    # business_id / user_id are NOT sent from the client.
    assert "shopId" not in http.last["json"] and "userId" not in http.last["json"]


def test_update_ticket_patches(http, config):
    update_ticket("t1", {"status": "RESOLVED"}, config)
    assert http.last["method"] == "patch"
    assert http.last["url"] == f"{BASE_URL}/support/tickets/t1"
    assert http.last["json"] == {"status": "RESOLVED"}


def test_get_ticket_status_gets(http, config):
    get_ticket_status("t1", config)
    assert http.last["method"] == "get"
    assert http.last["url"] == f"{BASE_URL}/support/tickets/t1"


def test_dispatch_create(http, config):
    data = {"category": "AUTH", "issueSummary": "cannot login"}
    dispatch(action="create_ticket", ticket_data=data, config=config)
    assert http.last["method"] == "post"
    assert http.last["url"] == f"{BASE_URL}/support/tickets"


def test_dispatch_get_status(http, config):
    dispatch(action="get_ticket_status", ticket_id="t9", config=config)
    assert http.last["url"] == f"{BASE_URL}/support/tickets/t9"


def test_dispatch_list(http, config):
    dispatch(action="list_tickets", config=config)
    assert http.last["url"] == f"{BASE_URL}/support/tickets"


def test_dispatch_invalid_makes_no_request(http, config):
    result = dispatch(action="delete_everything", config=config)
    assert result["ok"] is False
    assert http.calls == []
