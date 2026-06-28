"""Invoice domain tools (used by the Invoice agent): sales & purchases."""

from datetime import date

from langchain_core.runnables.config import RunnableConfig

from .common import BASE_URL, _err, _ok, dynamic_prompt, get_headers, logged_request


@dynamic_prompt("invoice_tool")
def invoice_tool(action: str, type: str, invoice_id: str = None, invoice_data: dict = None, config: RunnableConfig = None) -> dict:
    endpoint = "/sales" if type == "sale" else "/purchase"

    if action == "get_all":
        return logged_request("get", f"{BASE_URL}{endpoint}", headers=get_headers(config))
    elif action == "get_by_id" and invoice_id:
        return logged_request("get", f"{BASE_URL}{endpoint}/{invoice_id}", headers=get_headers(config))
    elif action == "get_todays":
        if type == "sale":
            # Server-side "today" filter for sales.
            return logged_request("get", f"{BASE_URL}/sales", params={"date": "today"}, headers=get_headers(config))
        # Purchases have no date filter on the API yet — fall back to client-side filtering.
        resp = logged_request("get", f"{BASE_URL}{endpoint}", headers=get_headers(config))
        if not resp.get("ok"):
            return resp
        today_str = date.today().isoformat()
        return _ok([i for i in (resp["data"] or []) if str(i.get("createdAt", "")).startswith(today_str)])
    elif action == "add" and invoice_data:
        return logged_request("post", f"{BASE_URL}{endpoint}", json=invoice_data, headers=get_headers(config))
    elif action == "update" and invoice_id and invoice_data and type == "sale":
        return logged_request("put", f"{BASE_URL}/sales/{invoice_id}", json=invoice_data, headers=get_headers(config))
    elif action == "update" and type == "purchase":
        return _err("Purchases cannot be updated in the current API implementation.")

    return _err("Invalid action or missing parameters.")
