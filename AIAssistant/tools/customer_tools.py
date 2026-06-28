"""Customer domain tools (used by the Customer agent)."""

from langchain_core.runnables.config import RunnableConfig

from .common import BASE_URL, _err, _ok, dynamic_prompt, get_headers, logged_request


@dynamic_prompt("customer_tool")
def customer_tool(action: str, customer_id: str = None, name_search: str = None, customer_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "get_all":
        return logged_request("get", f"{BASE_URL}/customers", headers=get_headers(config))
    elif action == "get_by_id" and customer_id:
        return logged_request("get", f"{BASE_URL}/customers/{customer_id}", headers=get_headers(config))
    elif action == "add" and customer_data:
        return logged_request("post", f"{BASE_URL}/customers", json=customer_data, headers=get_headers(config))
    elif action == "update" and customer_id and customer_data:
        return logged_request("put", f"{BASE_URL}/customers/{customer_id}", json=customer_data, headers=get_headers(config))
    elif action == "delete" and customer_id:
        return logged_request("delete", f"{BASE_URL}/customers/{customer_id}", headers=get_headers(config))
    elif action == "search" and name_search:
        # Server-side search (no longer fetches the whole list and filters in Python).
        return logged_request("get", f"{BASE_URL}/customers", params={"search": name_search}, headers=get_headers(config))
    elif action == "get_ledger" and customer_id:
        # A real ledger nets sales (debits) against payments (credits).
        sales = logged_request("get", f"{BASE_URL}/sales", params={"customerId": customer_id}, headers=get_headers(config))
        if not sales.get("ok"):
            return sales
        payments = logged_request("get", f"{BASE_URL}/payment", headers=get_headers(config))
        customer_payments = []
        if payments.get("ok"):
            customer_payments = [p for p in (payments["data"] or []) if p.get("customerId") == customer_id]
        return _ok({"sales": sales["data"], "payments": customer_payments})

    return _err("Invalid action or missing parameters.")
