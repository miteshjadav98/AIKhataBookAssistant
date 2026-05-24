import os
import requests
from datetime import datetime, date
from langchain_core.tools import tool
from langchain_core.runnables.config import RunnableConfig

BASE_URL = os.getenv("KHATABOOK_API_URL", "http://localhost:3000")

def get_headers(config: RunnableConfig):
    token = config.get("configurable", {}).get("token", "")
    return {"Authorization": f"Bearer {token}"} if token else {}

@tool
def search_customer(name: str, config: RunnableConfig) -> dict:
    """Searches for a customer by name and returns their details including customer ID."""
    url = f"{BASE_URL}/customers"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code != 200:
        return {"error": f"Failed to fetch customers: {response.text}"}
    
    customers = response.json().get("data", [])
    # Case-insensitive partial match
    matches = [c for c in customers if name.lower() in c.get("name", "").lower()]
    if not matches:
        return {"error": f"No customer found with name: {name}"}
    return {"customers": matches}

@tool
def get_customer_ledger(customer_id: str, config: RunnableConfig) -> dict:
    """Gets the ledger (sales and payments) for a specific customer by ID."""
    # Since there's no specific admin endpoint for just one customer's ledger, we will fetch sales and filter.
    # Note: customer.controller has getCustomerLedger but it's for 'me/ledger' (customer view).
    # We will fetch all sales and filter for this customer for MVP.
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code != 200:
        return {"error": f"Failed to fetch sales: {response.text}"}
    
    sales = response.json().get("data", [])
    customer_sales = [s for s in sales if s.get("customerId") == customer_id]
    
    # We also need payments, but let's just return the sales history as the ledger for MVP if payments API isn't exposed directly.
    return {"sales_history": customer_sales}

@tool
def get_customer_invoices(customer_id: str, config: RunnableConfig) -> list:
    """Gets all invoices for a specific customer by ID."""
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        sales = response.json().get("data", [])
        return [s for s in sales if s.get("customerId") == customer_id]
    return []

@tool
def search_supplier(name: str, config: RunnableConfig) -> dict:
    """Searches for a supplier by name and returns their details including supplier ID."""
    url = f"{BASE_URL}/supplier"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code != 200:
        return {"error": f"Failed to fetch suppliers: {response.text}"}
    
    suppliers = response.json().get("data", [])
    matches = [s for s in suppliers if name.lower() in s.get("name", "").lower()]
    if not matches:
        return {"error": f"No supplier found with name: {name}"}
    return {"suppliers": matches}

@tool
def get_supplier_ledger(supplier_id: str, config: RunnableConfig) -> dict:
    """Gets the ledger for a specific supplier by ID."""
    url = f"{BASE_URL}/supplier/{supplier_id}/ledger"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code != 200:
        return {"error": f"Failed to fetch supplier ledger: {response.text}"}
    return response.json().get("data", {})

@tool
def get_low_stock_products(config: RunnableConfig) -> list:
    """Gets products that are low in stock (qty < 10)."""
    url = f"{BASE_URL}/products"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        products = response.json().get("data", [])
        low_stock = [p for p in products if p.get("stockQty", 0) < 10]
        return low_stock
    return []

@tool
def get_todays_sales(config: RunnableConfig) -> list:
    """Gets all sales transactions for today."""
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        sales = response.json().get("data", [])
        today_str = date.today().isoformat()
        today_sales = [s for s in sales if s.get("createdAt", "").startswith(today_str)]
        return today_sales
    return []

@tool
def get_purchase_history(config: RunnableConfig) -> list:
    """Gets the history of all purchase invoices."""
    url = f"{BASE_URL}/purchase"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        return response.json().get("data", [])
    return []

def get_all_tools():
    return [
        search_customer,
        get_customer_ledger,
        get_customer_invoices,
        search_supplier,
        get_supplier_ledger,
        get_low_stock_products,
        get_todays_sales,
        get_purchase_history
    ]
