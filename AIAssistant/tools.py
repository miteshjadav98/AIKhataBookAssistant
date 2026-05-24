import os
import requests
from datetime import datetime, date
from langchain_core.tools import tool
from langchain_core.runnables.config import RunnableConfig

BASE_URL = os.getenv("KHATABOOK_API_URL", "http://localhost:3000")

def get_headers(config: RunnableConfig):
    token = config.get("configurable", {}).get("token", "")
    return {"Authorization": f"Bearer {token}"} if token else {}

# ==========================================
# CUSTOMERS (ADMIN)
# ==========================================

@tool
def add_customer(customer_data: dict, config: RunnableConfig) -> dict:
    """Add a new customer to the shop. customer_data should be a dict with fields like 'name', 'phone', etc."""
    print(f"\n---> [TOOL CALLED] add_customer")
    url = f"{BASE_URL}/customers"
    response = requests.post(url, json=customer_data, headers=get_headers(config))
    return response.json()

@tool
def get_all_customers(config: RunnableConfig) -> dict:
    """Gets a list of all customers in the shop."""
    print(f"\n---> [TOOL CALLED] get_all_customers")
    url = f"{BASE_URL}/customers"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_customer_by_id(customer_id: str, config: RunnableConfig) -> dict:
    """Gets details of a single customer by their ID."""
    print(f"\n---> [TOOL CALLED] get_customer_by_id")
    url = f"{BASE_URL}/customers/{customer_id}"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def update_customer(customer_id: str, customer_data: dict, config: RunnableConfig) -> dict:
    """Updates an existing customer. customer_data is a dict containing the fields to update."""
    print(f"\n---> [TOOL CALLED] update_customer")
    url = f"{BASE_URL}/customers/{customer_id}"
    response = requests.put(url, json=customer_data, headers=get_headers(config))
    return response.json()

@tool
def delete_customer(customer_id: str, config: RunnableConfig) -> dict:
    """Soft deletes a customer by ID."""
    print(f"\n---> [TOOL CALLED] delete_customer")
    url = f"{BASE_URL}/customers/{customer_id}"
    response = requests.delete(url, headers=get_headers(config))
    return response.json()

@tool
def search_customer(name: str, config: RunnableConfig) -> dict:
    """Searches for a customer by name and returns their details including customer ID."""
    print(f"\n---> [TOOL CALLED] search_customer")
    url = f"{BASE_URL}/customers"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code != 200:
        return {"error": f"Failed to fetch customers: {response.text}"}
    
    customers = response.json().get("data", [])
    matches = [c for c in customers if name.lower() in c.get("name", "").lower()]
    if not matches:
        return {"error": f"No customer found with name: {name}"}
    return {"customers": matches}

# ==========================================
# CUSTOMERS (SELF-SERVE)
# ==========================================

@tool
def get_my_balance(config: RunnableConfig) -> dict:
    """Gets the outstanding balance (Bakaya) for the logged-in customer."""
    print(f"\n---> [TOOL CALLED] get_my_balance")
    url = f"{BASE_URL}/customers/me/balance"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_my_ledger(config: RunnableConfig) -> dict:
    """Gets the ledger (Sales and Payments) for the logged-in customer."""
    print(f"\n---> [TOOL CALLED] get_my_ledger")
    url = f"{BASE_URL}/customers/me/ledger"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_my_sale(sale_id: str, config: RunnableConfig) -> dict:
    """Gets a specific sale invoice for the logged-in customer."""
    print(f"\n---> [TOOL CALLED] get_my_sale")
    url = f"{BASE_URL}/customers/me/sale/{sale_id}"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_my_shops(config: RunnableConfig) -> dict:
    """Gets all shops where the logged-in account is registered."""
    print(f"\n---> [TOOL CALLED] get_my_shops")
    url = f"{BASE_URL}/customers/me/shops"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

# ==========================================
# PRODUCTS
# ==========================================

@tool
def add_product(product_data: dict, config: RunnableConfig) -> dict:
    """Add a new product to the shop. product_data should include 'name', 'price', etc."""
    print(f"\n---> [TOOL CALLED] add_product")
    url = f"{BASE_URL}/products"
    response = requests.post(url, json=product_data, headers=get_headers(config))
    return response.json()

@tool
def get_all_products(config: RunnableConfig) -> dict:
    """List all products in the shop."""
    print(f"\n---> [TOOL CALLED] get_all_products")
    url = f"{BASE_URL}/products"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_product_by_id(product_id: str, config: RunnableConfig) -> dict:
    """Get a single product with its inventory history."""
    print(f"\n---> [TOOL CALLED] get_product_by_id")
    url = f"{BASE_URL}/products/{product_id}"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def update_product(product_id: str, product_data: dict, config: RunnableConfig) -> dict:
    """Update a product."""
    print(f"\n---> [TOOL CALLED] update_product")
    url = f"{BASE_URL}/products/{product_id}"
    response = requests.put(url, json=product_data, headers=get_headers(config))
    return response.json()

@tool
def delete_product(product_id: str, config: RunnableConfig) -> dict:
    """Delete a product."""
    print(f"\n---> [TOOL CALLED] delete_product")
    url = f"{BASE_URL}/products/{product_id}"
    response = requests.delete(url, headers=get_headers(config))
    return response.json()

@tool
def get_low_stock_products(config: RunnableConfig) -> list:
    """Gets products that are low in stock (qty < 10)."""
    print(f"\n---> [TOOL CALLED] get_low_stock_products")
    url = f"{BASE_URL}/products"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        products = response.json().get("data", [])
        low_stock = [p for p in products if p.get("stockQty", 0) < 10]
        return low_stock
    return []

# ==========================================
# SUPPLIERS
# ==========================================

@tool
def add_supplier(supplier_data: dict, config: RunnableConfig) -> dict:
    """Add a new supplier.
    supplier_data MUST be a JSON object with this exact schema:
    {
        "name": "Supplier Name",
        "phone": "Phone number (optional)",
        "email": "Email (optional)",
        "gstin": "GSTIN (optional)",
        "billingAddress": "Address (optional)"
    }
    """
    print(f"\n---> [TOOL CALLED] add_supplier")
    url = f"{BASE_URL}/supplier"
    response = requests.post(url, json=supplier_data, headers=get_headers(config))
    return response.json()

@tool
def get_all_suppliers(config: RunnableConfig) -> dict:
    """List all suppliers."""
    print(f"\n---> [TOOL CALLED] get_all_suppliers")
    url = f"{BASE_URL}/supplier"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_supplier_by_id(supplier_id: str, config: RunnableConfig) -> dict:
    """Get a single supplier by ID."""
    print(f"\n---> [TOOL CALLED] get_supplier_by_id")
    url = f"{BASE_URL}/supplier/{supplier_id}"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def search_supplier(name: str, config: RunnableConfig) -> dict:
    """Searches for a supplier by name."""
    print(f"\n---> [TOOL CALLED] search_supplier")
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
    print(f"\n---> [TOOL CALLED] get_supplier_ledger")
    url = f"{BASE_URL}/supplier/{supplier_id}/ledger"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

# ==========================================
# PURCHASES
# ==========================================

@tool
def add_purchase(purchase_data: dict, config: RunnableConfig) -> dict:
    """Add a new purchase invoice.
    purchase_data MUST be a JSON object with this exact schema:
    {
        "supplierId": "UUID of the supplier",
        "invoiceNumber": "Invoice number string (optional)",
        "items": [
            {
                "productId": "UUID of the product",
                "qty": number,
                "purchasePrice": number,
                "sellingPrice": number
            }
        ],
        "subtotal": number,
        "paidAmount": number,
        "discount": number,
        "paymentMode": "CASH" | "ONLINE" | "BANK_TRANSFER" | "CHEQUE",
        "notes": "Optional notes"
    }
    """
    print(f"\n---> [TOOL CALLED] add_purchase")
    url = f"{BASE_URL}/purchase"
    response = requests.post(url, json=purchase_data, headers=get_headers(config))
    return response.json()

@tool
def get_all_purchases(config: RunnableConfig) -> dict:
    """Get all purchase history."""
    print(f"\n---> [TOOL CALLED] get_all_purchases")
    url = f"{BASE_URL}/purchase"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_purchase_by_id(purchase_id: str, config: RunnableConfig) -> dict:
    """Get a single purchase by ID."""
    print(f"\n---> [TOOL CALLED] get_purchase_by_id")
    url = f"{BASE_URL}/purchase/{purchase_id}"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_purchase_history(config: RunnableConfig) -> list:
    """Gets the history of all purchase invoices."""
    print(f"\n---> [TOOL CALLED] get_purchase_history")
    url = f"{BASE_URL}/purchase"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        return response.json().get("data", [])
    return []

# ==========================================
# SALES
# ==========================================

@tool
def add_sale(sale_data: dict, config: RunnableConfig) -> dict:
    """Add a new sales invoice.
    sale_data MUST be a JSON object with this exact schema:
    {
        "customerId": "UUID of the customer",
        "invoiceNumber": "Invoice number string (optional)",
        "items": [
            {
                "productId": "UUID of the product",
                "qty": number,
                "sellingPrice": number
            }
        ],
        "paidAmount": number,
        "discount": number,
        "paymentMode": "CASH" | "ONLINE" | "BANK_TRANSFER" | "CHEQUE",
        "notes": "Optional notes"
    }
    """
    print(f"\n---> [TOOL CALLED] add_sale")
    url = f"{BASE_URL}/sales"
    response = requests.post(url, json=sale_data, headers=get_headers(config))
    return response.json()

@tool
def get_all_sales(config: RunnableConfig) -> dict:
    """Get all sales."""
    print(f"\n---> [TOOL CALLED] get_all_sales")
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_sale_by_id(sale_id: str, config: RunnableConfig) -> dict:
    """Get a single sale by ID."""
    print(f"\n---> [TOOL CALLED] get_sale_by_id")
    url = f"{BASE_URL}/sales/{sale_id}"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def update_sale(sale_id: str, sale_data: dict, config: RunnableConfig) -> dict:
    """Update an existing sale invoice.
    sale_data MUST be a JSON object with this exact schema:
    {
        "invoiceNumber": "Invoice number string",
        "discount": number (updated discount),
        "notes": "Updated notes",
        "reason": "MANDATORY string explaining the reason for this edit (e.g. 'Corrected discount')"
    }
    """
    print(f"\n---> [TOOL CALLED] update_sale")
    url = f"{BASE_URL}/sales/{sale_id}"
    response = requests.put(url, json=sale_data, headers=get_headers(config))
    return response.json()

@tool
def get_sale_edit_history(sale_id: str, config: RunnableConfig) -> dict:
    """Get the edit history of a sale."""
    print(f"\n---> [TOOL CALLED] get_sale_edit_history")
    url = f"{BASE_URL}/sales/{sale_id}/edit-history"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

@tool
def get_todays_sales(config: RunnableConfig) -> list:
    """Gets all sales transactions for today."""
    print(f"\n---> [TOOL CALLED] get_todays_sales")
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        sales = response.json().get("data", [])
        today_str = date.today().isoformat()
        today_sales = [s for s in sales if s.get("createdAt", "").startswith(today_str)]
        return today_sales
    return []

@tool
def get_customer_invoices(customer_id: str, config: RunnableConfig) -> list:
    """Gets all invoices for a specific customer by ID."""
    print(f"\n---> [TOOL CALLED] get_customer_invoices")
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code == 200:
        sales = response.json().get("data", [])
        return [s for s in sales if s.get("customerId") == customer_id]
    return []

@tool
def get_customer_ledger(customer_id: str, config: RunnableConfig) -> dict:
    """Gets the ledger (sales and payments) for a specific customer by ID."""
    print(f"\n---> [TOOL CALLED] get_customer_ledger")
    url = f"{BASE_URL}/sales"
    response = requests.get(url, headers=get_headers(config))
    if response.status_code != 200:
        return {"error": f"Failed to fetch sales: {response.text}"}
    sales = response.json().get("data", [])
    customer_sales = [s for s in sales if s.get("customerId") == customer_id]
    return {"sales_history": customer_sales}

# ==========================================
# PAYMENTS
# ==========================================

@tool
def add_payment(payment_data: dict, config: RunnableConfig) -> dict:
    """Add a new payment."""
    print(f"\n---> [TOOL CALLED] add_payment")
    url = f"{BASE_URL}/payment"
    response = requests.post(url, json=payment_data, headers=get_headers(config))
    return response.json()

@tool
def get_all_payments(config: RunnableConfig) -> dict:
    """Get all payments."""
    print(f"\n---> [TOOL CALLED] get_all_payments")
    url = f"{BASE_URL}/payment"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

# ==========================================
# DASHBOARD
# ==========================================

@tool
def get_dashboard(config: RunnableConfig) -> dict:
    """Gets the shop's main dashboard metrics: totalDue, totalCollected, overdueAmount, monthlyRevenue, totalCustomers, customersWithDue."""
    print(f"\n---> [TOOL CALLED] get_dashboard")
    url = f"{BASE_URL}/dashboard"
    response = requests.get(url, headers=get_headers(config))
    return response.json()

# ==========================================
# REGISTRY
# ==========================================

def get_all_tools():
    return [
        add_customer, get_all_customers, get_customer_by_id, update_customer, delete_customer, search_customer,
        get_my_balance, get_my_ledger, get_my_sale, get_my_shops,
        add_product, get_all_products, get_product_by_id, update_product, delete_product, get_low_stock_products,
        add_supplier, get_all_suppliers, get_supplier_by_id, search_supplier, get_supplier_ledger,
        add_purchase, get_all_purchases, get_purchase_by_id, get_purchase_history,
        add_sale, get_all_sales, get_sale_by_id, update_sale, get_sale_edit_history, get_todays_sales, get_customer_invoices, get_customer_ledger,
        add_payment, get_all_payments, get_dashboard
    ]
