"""Unit tests for the shared HTTP envelope (tools/common.py)."""

import requests

from tests.conftest import FakeResponse
from tools.common import get_headers, logged_request


def test_success_unwraps_data_envelope(http):
    http.response = FakeResponse(200, {"status": "success", "data": {"x": 1}})
    result = logged_request("get", "http://test-api/things")
    assert result == {"ok": True, "data": {"x": 1}}


def test_success_passes_through_when_no_data_key(http):
    http.response = FakeResponse(200, {"a": 1})
    result = logged_request("get", "http://test-api/things")
    assert result == {"ok": True, "data": {"a": 1}}


def test_error_uses_message_field(http):
    http.response = FakeResponse(400, {"message": "bad request"})
    result = logged_request("get", "http://test-api/things")
    assert result == {"ok": False, "error": "bad request"}


def test_error_without_body_reports_status(http):
    http.response = FakeResponse(500, None)
    result = logged_request("get", "http://test-api/things")
    assert result["ok"] is False
    assert "500" in result["error"]


def test_network_error_is_caught(monkeypatch):
    def boom(*args, **kwargs):
        raise requests.exceptions.ConnectionError("refused")

    monkeypatch.setattr("tools.common.requests.request", boom)
    result = logged_request("get", "http://test-api/things")
    assert result["ok"] is False
    assert "Could not reach" in result["error"]


def test_default_timeout_is_applied(http):
    logged_request("get", "http://test-api/things")
    assert http.last["timeout"] == 30


def test_get_headers_builds_bearer(config):
    assert get_headers(config) == {"Authorization": "Bearer test-jwt"}


def test_get_headers_empty_without_token():
    assert get_headers({}) == {}
    assert get_headers(None) == {}
