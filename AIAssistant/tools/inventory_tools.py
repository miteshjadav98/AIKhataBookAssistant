"""Inventory domain tools (used by the Inventory agent): products + suppliers."""

from langchain_core.runnables.config import RunnableConfig

from .common import BASE_URL, _err, _ok, dynamic_prompt, get_headers, logged_request


@dynamic_prompt("inventory_tool")
def inventory_tool(action: str, product_id: str = None, product_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "get_all":
        return logged_request("get", f"{BASE_URL}/products", headers=get_headers(config))
    elif action == "get_by_id" and product_id:
        return logged_request("get", f"{BASE_URL}/products/{product_id}", headers=get_headers(config))
    elif action == "add" and product_data:
        return logged_request("post", f"{BASE_URL}/products", json=product_data, headers=get_headers(config))
    elif action == "update" and product_id and product_data:
        return logged_request("put", f"{BASE_URL}/products/{product_id}", json=product_data, headers=get_headers(config))
    elif action == "delete" and product_id:
        return logged_request("delete", f"{BASE_URL}/products/{product_id}", headers=get_headers(config))
    elif action == "get_low_stock":
        # Server-side low-stock filter (per-product threshold) instead of a hardcoded "< 10" in Python.
        return logged_request("get", f"{BASE_URL}/products", params={"lowStock": "true"}, headers=get_headers(config))

    return _err("Invalid action or missing parameters.")


@dynamic_prompt("supplier_tool")
def supplier_tool(action: str, supplier_id: str = None, name_search: str = None, supplier_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "get_all":
        return logged_request("get", f"{BASE_URL}/supplier", headers=get_headers(config))
    elif action == "get_by_id" and supplier_id:
        return logged_request("get", f"{BASE_URL}/supplier/{supplier_id}", headers=get_headers(config))
    elif action == "add" and supplier_data:
        return logged_request("post", f"{BASE_URL}/supplier", json=supplier_data, headers=get_headers(config))
    elif action == "search" and name_search:
        resp = logged_request("get", f"{BASE_URL}/supplier", headers=get_headers(config))
        if not resp.get("ok"):
            return resp
        matches = [s for s in (resp["data"] or []) if name_search.lower() in s.get("name", "").lower()]
        return _ok({"suppliers": matches}) if matches else _err("Not found")
    elif action == "get_ledger" and supplier_id:
        return logged_request("get", f"{BASE_URL}/supplier/{supplier_id}/ledger", headers=get_headers(config))

    return _err("Invalid action or missing parameters.")
