# KhataBook — Policies, Terms & FAQs

This document is indexed into the assistant's knowledge base so the bot can answer
questions about how KhataBook works, its policies, and common procedures.
Edit this file (or add more `.md`/`.txt`/`.pdf` files in this folder) and re-run
`python ingest_kb.py` to update the knowledge base.

## Interest on Overdue Credit
- Payments made within 30 days of a credit sale incur **no interest**.
- Amounts overdue between 1 and 6 months accrue **3% per month**, compounded.
- Amounts overdue beyond 6 months accrue **6% per month**, compounded.
- A shop can configure its own default interest rate, which overrides the above.

## Customer Accounts
- Each customer added by a shop receives a **temporary password** and must change it on first login.
- A customer's outstanding balance ("totalReceivable") is the amount they owe the shop.
- Customers can be soft-deleted; their transaction history is retained for audit.

## Invoices (Sales & Purchases)
- Sales invoice numbers are auto-generated per shop in the format `INV<YEAR><0001>`.
- Financial edits to a sale (e.g. changing the discount) are allowed **only within 24 hours** of creation.
- Every invoice edit is recorded in an audit log with a before/after snapshot and a reason.
- Purchases require the supplier's invoice number and cannot be edited after creation.

## Payments
- A `CUSTOMER_PAYMENT` reduces that customer's outstanding receivable.
- A `SUPPLIER_PAYMENT` reduces the shop's payable to that supplier.
- Supported payment modes: CASH, ONLINE, UPI, BANK_TRANSFER, CHEQUE, OTHER.

## Data & Privacy
- Each shop's data is isolated; staff and admins only see their own shop's records.
- Authentication uses JWT tokens that expire after 7 days.
- The AI assistant only acts on data the logged-in user is authorized to access.

## Refunds & Returns
- Stock returns are recorded as inventory movements of type RETURN.
- Refund handling is at the shopkeeper's discretion and should be logged as a payment or adjustment.
