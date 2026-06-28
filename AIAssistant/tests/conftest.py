"""Shared pytest fixtures for the AI assistant.

Env defaults are set at import time (before test modules import the tool packages) so the
LLM factory and tools construct without real credentials or a real backend.
"""

import os

# Must be set before `tools.*` / `agents.*` are imported by the test modules.
os.environ.setdefault("KHATABOOK_API_URL", "http://test-api")
os.environ.setdefault("OLLAMA_API_KEY", "test-key")
os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("AZURE_OPENAI_API_KEY", "test-key")

import pytest  # noqa: E402


class FakeResponse:
    """Minimal stand-in for a `requests.Response`."""

    def __init__(self, status_code=200, json_data=None, ok=None):
        self.status_code = status_code
        self._json = json_data
        self.ok = ok if ok is not None else (200 <= status_code < 300)

    def json(self):
        if self._json is None:
            raise ValueError("No JSON body")
        return self._json


class RequestRecorder:
    """Records calls to requests.request and returns a configurable FakeResponse."""

    def __init__(self, response=None):
        self.calls = []
        self.response = response or FakeResponse(200, {"status": "success", "data": []})

    def __call__(self, method, url, **kwargs):
        self.calls.append({"method": method, "url": url, **kwargs})
        return self.response

    @property
    def last(self):
        return self.calls[-1]


@pytest.fixture
def http(monkeypatch):
    """Patch the shared HTTP layer used by every tool; returns the recorder."""
    rec = RequestRecorder()
    monkeypatch.setattr("tools.common.requests.request", rec)
    return rec


@pytest.fixture
def config():
    """A LangGraph run config carrying the JWT, as the FastAPI layer builds it."""
    return {"configurable": {"token": "test-jwt", "thread_id": "thread-1"}}
