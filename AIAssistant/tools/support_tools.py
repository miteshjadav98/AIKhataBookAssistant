"""Support domain tools (used by the Support agent).

Tickets are persisted via the KhataBook backend (`/support/tickets`). The agent only sends
the issue fields (category / priority / issueSummary / issueDetails / status); the backend
derives `business_id` (shopId) and `user_id` from the JWT, so they are never trusted from
the client. `support_tool` is the single action-dispatch tool exposed to the LLM; the
`create_ticket` / `update_ticket` / `get_ticket_status` helpers are the underlying API calls
(kept as standalone functions so they're directly unit-testable).
"""

from langchain_core.runnables.config import RunnableConfig

from .common import BASE_URL, _err, dynamic_prompt, get_headers, logged_request


def create_ticket(ticket_data: dict, config: RunnableConfig = None) -> dict:
    """POST a new support ticket. business_id/user_id are added server-side from the JWT."""
    return logged_request("post", f"{BASE_URL}/support/tickets", json=ticket_data, headers=get_headers(config))


def update_ticket(ticket_id: str, ticket_data: dict, config: RunnableConfig = None) -> dict:
    """PATCH an existing ticket (e.g. status, priority, more details)."""
    return logged_request("patch", f"{BASE_URL}/support/tickets/{ticket_id}", json=ticket_data, headers=get_headers(config))


def get_ticket_status(ticket_id: str, config: RunnableConfig = None) -> dict:
    """GET a single ticket (used to report its current status)."""
    return logged_request("get", f"{BASE_URL}/support/tickets/{ticket_id}", headers=get_headers(config))


@dynamic_prompt("support_tool")
def support_tool(action: str, ticket_id: str = None, ticket_data: dict = None, config: RunnableConfig = None) -> dict:
    if action == "create_ticket" and ticket_data:
        return create_ticket(ticket_data, config)
    elif action == "update_ticket" and ticket_id and ticket_data:
        return update_ticket(ticket_id, ticket_data, config)
    elif action == "get_ticket_status" and ticket_id:
        return get_ticket_status(ticket_id, config)
    elif action == "list_tickets":
        return logged_request("get", f"{BASE_URL}/support/tickets", headers=get_headers(config))

    return _err("Invalid action or missing parameters.")
