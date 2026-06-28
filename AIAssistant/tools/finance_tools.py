"""Finance domain tools (used by the Finance agent, and payment_tool shared with Customer)."""

from langchain_core.runnables.config import RunnableConfig

from .common import BASE_URL, _err, dynamic_prompt, get_headers, logged_request


@dynamic_prompt("payment_tool")
def payment_tool(action: str, payment_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "get_all":
        return logged_request("get", f"{BASE_URL}/payment", headers=get_headers(config))
    elif action == "add" and payment_data:
        return logged_request("post", f"{BASE_URL}/payment", json=payment_data, headers=get_headers(config))

    return _err("Invalid action or missing parameters.")


@dynamic_prompt("analytics_tool")
def analytics_tool(action: str, config: RunnableConfig = None) -> dict:
    if action == "get_dashboard":
        return logged_request("get", f"{BASE_URL}/dashboard", headers=get_headers(config))

    return _err("Invalid action.")
