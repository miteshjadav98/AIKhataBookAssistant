import os
import requests
from datetime import datetime, date
from langchain_core.tools import tool
from langchain_core.runnables.config import RunnableConfig
from prompt_utils import getprompt

BASE_URL = os.getenv("KHATABOOK_API_URL", "http://localhost:3001")


def get_headers(config: RunnableConfig):
    token = config.get("configurable", {}).get("token", "")
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
    """Decorator to inject a prompt string dynamically as the tool's description."""
    def decorator(func):
        # We use @tool(description=...) so LangChain picks it up reliably.
        # Alternatively we can set func.__doc__, but description= is safer.
        return tool(func.__name__, description=getprompt(key))(func)
    return decorator

# ==========================================
# CUSTOMER TOOL
# ==========================================

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

# ==========================================
# INVENTORY TOOL
# ==========================================

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

# ==========================================
# SUPPLIER TOOL
# ==========================================

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

# ==========================================
# INVOICE TOOL (Sales & Purchases)
# ==========================================

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

# ==========================================
# PAYMENT TOOL
# ==========================================

@dynamic_prompt("payment_tool")
def payment_tool(action: str, payment_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "get_all":
        return logged_request("get", f"{BASE_URL}/payment", headers=get_headers(config))
    elif action == "add" and payment_data:
        return logged_request("post", f"{BASE_URL}/payment", json=payment_data, headers=get_headers(config))

    return _err("Invalid action or missing parameters.")

# ==========================================
# ANALYTICS TOOL
# ==========================================

@dynamic_prompt("analytics_tool")
def analytics_tool(action: str, config: RunnableConfig = None) -> dict:
    if action == "get_dashboard":
        return logged_request("get", f"{BASE_URL}/dashboard", headers=get_headers(config))

    return _err("Invalid action.")

# ==========================================
# KNOWLEDGE SEARCH TOOL (RAG)
# ==========================================

@dynamic_prompt("knowledge_search_tool")
def knowledge_search_tool(query: str, config: RunnableConfig = None) -> dict:
    # Lazy import so the agent still boots if RAG deps aren't installed.
    import rag

    thread_id = None
    if config:
        thread_id = config.get("configurable", {}).get("thread_id")

    if not rag.is_configured():
        return _err("Knowledge base is not configured (Azure embeddings missing).")

    try:
        docs = rag.search(query, k=4, scope=thread_id)
    except Exception as e:  # noqa: BLE001 - surface a clean message to the agent
        return _err(f"Knowledge search failed: {e}")

    if not docs:
        return _ok({"results": [], "note": "No matching documents found in the knowledge base."})

    results = [
        {
            "source": d.metadata.get("source", "knowledge_base"),
            "scope": d.metadata.get("scope"),
            "content": d.page_content,
        }
        for d in docs
    ]
    return _ok({"results": results})

# ==========================================
# REGISTRY
# ==========================================

def get_all_tools():
    return [
        customer_tool,
        inventory_tool,
        supplier_tool,
        invoice_tool,
        payment_tool,
        analytics_tool,
        knowledge_search_tool,
    ]
