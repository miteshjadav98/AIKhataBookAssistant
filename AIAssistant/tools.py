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

def logged_request(method, url, **kwargs):
    print(f"\n--- [Tool API] {method.upper()} {url} ---")
    if "json" in kwargs:
        print(f"Payload: {kwargs['json']}")
    resp = requests.request(method, url, **kwargs)
    print(f"Status: {resp.status_code}")
    try:
        parsed = resp.json()
        print(f"Response: {parsed}")
        print("--------------------------------------\n")
        return parsed
    except Exception:
        print(f"Response Text: {resp.text}")
        print("--------------------------------------\n")
        return {"error": f"API returned non-JSON response (Status {resp.status_code}): {resp.text[:200]}"}

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
        resp = logged_request("get", f"{BASE_URL}/customers", headers=get_headers(config))
        if "error" in resp:
            return resp
        matches = [c for c in resp.get("data", []) if name_search.lower() in c.get("name", "").lower()]
        return {"customers": matches} if matches else {"error": "Not found"}
    elif action == "get_ledger" and customer_id:
        resp = logged_request("get", f"{BASE_URL}/sales", headers=get_headers(config))
        if "error" not in resp:
            return {"sales": [s for s in resp.get("data", []) if s.get("customerId") == customer_id]}
        return {"error": "Failed to fetch"}
    
    return {"error": "Invalid action or missing parameters."}

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
        resp = logged_request("get", f"{BASE_URL}/products", headers=get_headers(config))
        if "error" not in resp:
            return {"products": [p for p in resp.get("data", []) if p.get("stockQty", 0) < 10]}
        return {"error": "Failed to fetch"}
    
    return {"error": "Invalid action or missing parameters."}

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
        if "error" in resp:
            return resp
        matches = [s for s in resp.get("data", []) if name_search.lower() in s.get("name", "").lower()]
        return {"suppliers": matches} if matches else {"error": "Not found"}
    elif action == "get_ledger" and supplier_id:
        return logged_request("get", f"{BASE_URL}/supplier/{supplier_id}/ledger", headers=get_headers(config))
    
    return {"error": "Invalid action or missing parameters."}

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
        resp = logged_request("get", f"{BASE_URL}{endpoint}", headers=get_headers(config))
        if "error" not in resp:
            today_str = date.today().isoformat()
            data = resp.get("data", [])
            return {"invoices": [i for i in data if i.get("createdAt", "").startswith(today_str)]}
        return {"error": "Failed to fetch"}
    elif action == "add" and invoice_data:
        return logged_request("post", f"{BASE_URL}{endpoint}", json=invoice_data, headers=get_headers(config))
    elif action == "update" and invoice_id and invoice_data and type == "sale":
        return logged_request("put", f"{BASE_URL}/sales/{invoice_id}", json=invoice_data, headers=get_headers(config))
    elif action == "update" and type == "purchase":
        return {"error": "Purchases cannot be updated in the current API implementation."}
    
    return {"error": "Invalid action or missing parameters."}

# ==========================================
# PAYMENT TOOL
# ==========================================

@dynamic_prompt("payment_tool")
def payment_tool(action: str, payment_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "get_all":
        return logged_request("get", f"{BASE_URL}/payment", headers=get_headers(config))
    elif action == "add" and payment_data:
        return logged_request("post", f"{BASE_URL}/payment", json=payment_data, headers=get_headers(config))
    
    return {"error": "Invalid action or missing parameters."}

# ==========================================
# ANALYTICS TOOL
# ==========================================

@dynamic_prompt("analytics_tool")
def analytics_tool(action: str, config: RunnableConfig = None) -> dict:
    if action == "get_dashboard":
        return logged_request("get", f"{BASE_URL}/dashboard", headers=get_headers(config))
    
    return {"error": "Invalid action."}

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
        analytics_tool
    ]
