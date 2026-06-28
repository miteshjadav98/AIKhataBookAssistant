"""Shared infrastructure for all domain tools.

Every tool talks to the KhataBook backend through `logged_request`, which returns a
single normalized envelope (`{ok, data}` / `{ok, error}`) so agents never have to guess
at the response shape. The JWT comes from the LangGraph run config (`configurable.token`)
and is forwarded by `get_headers` — this is what lets a supervisor delegate to a
specialist sub-agent and have the specialist's tools stay authenticated.
"""

import os

import requests
from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool

from prompt_utils import getprompt

BASE_URL = os.getenv("KHATABOOK_API_URL", "http://localhost:3001")


def get_headers(config: RunnableConfig):
    token = (config or {}).get("configurable", {}).get("token", "")
    return {"Authorization": f"Bearer {token}"} if token else {}


def _ok(data):
    """Normalized success envelope for the LLM."""
    return {"ok": True, "data": data}


def _err(message):
    """Normalized error envelope for the LLM."""
    return {"ok": False, "error": message}


def logged_request(method, url, **kwargs):
    """Make a request to the KhataBook API and return a normalized {ok, data}/{ok, error}.

    Every tool returns this same shape so the agent never has to guess at the
    response structure (success vs. error vs. raw list).
    """
    print(f"\n--- [Tool API] {method.upper()} {url} ---")
    if "json" in kwargs:
        print(f"Payload: {kwargs['json']}")
    if "params" in kwargs:
        print(f"Params: {kwargs['params']}")
    # Always bound the request so a slow/hung backend can't freeze the chat turn.
    kwargs.setdefault("timeout", 30)
    try:
        resp = requests.request(method, url, **kwargs)
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        print("--------------------------------------\n")
        return _err(f"Could not reach KhataBook API: {e}")

    print(f"Status: {resp.status_code}")
    try:
        body = resp.json()
    except ValueError:
        body = None

    if not resp.ok:
        message = None
        if isinstance(body, dict):
            message = body.get("message") or body.get("error")
        print(f"Error body: {body}")
        print("--------------------------------------\n")
        return _err(message or f"API error (status {resp.status_code})")

    # Unwrap the backend's {status, data} envelope when present.
    data = body.get("data") if isinstance(body, dict) and "data" in body else body
    print(f"Response data: {data}")
    print("--------------------------------------\n")
    return _ok(data)


def dynamic_prompt(key):
    """Decorator to inject a prompt string dynamically as the tool's description.

    We use @tool(description=...) so LangChain picks it up reliably.
    """
    def decorator(func):
        return tool(func.__name__, description=getprompt(key))(func)
    return decorator
