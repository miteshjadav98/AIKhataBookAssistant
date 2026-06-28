"""Structured schema + robust parser for the assistant's final answer.

The LangGraph agent is instructed (see config/prompts.json -> system_prompt) to
return a strict JSON object. LLMs, however, frequently wrap that JSON in prose or
markdown code fences. Instead of hand-rolling string slicing at the call site, we
validate the model output against a Pydantic schema and degrade gracefully when the
model misbehaves.
"""

from typing import Any, Optional

from pydantic import BaseModel, field_validator

# Visual components implemented on the frontend (see khatabook-frontend/src/components/ai).
ALLOWED_VISUAL_TYPES = {
    "ledger_summary",
    "sales_summary",
    "low_stock_alert",
    "invoice_preview",
}


class AssistantResponse(BaseModel):
    """The contract the chat UI expects back from the agent."""

    visual_response: str = ""
    visual_type: Optional[str] = None
    data: Optional[Any] = None
    spoken_response: str = ""
    language_code: str = "en-IN"

    @field_validator("visual_type", mode="before")
    @classmethod
    def _normalize_visual_type(cls, value: Any) -> Optional[str]:
        # The model sometimes hallucinates a component name or sends the string
        # "null" — collapse anything we can't render to None so the UI just shows text.
        if isinstance(value, str) and value in ALLOWED_VISUAL_TYPES:
            return value
        return None


def _extract_json_blob(raw: str) -> str:
    """Best-effort extraction of the outermost JSON object from an LLM reply."""
    text = raw.strip()
    # Strip a leading ```json / ``` fence if present.
    if text.startswith("```"):
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text
        if text.lstrip().lower().startswith("json"):
            text = text.lstrip()[4:]
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end >= start:
        return text[start : end + 1]
    return text


def parse_assistant_response(raw: str) -> AssistantResponse:
    """Parse the agent's final message into an AssistantResponse.

    Never raises: if the output isn't valid JSON we fall back to treating the whole
    reply as plain conversational text (so the user still hears/sees something).
    """
    candidate = _extract_json_blob(raw)
    try:
        return AssistantResponse.model_validate_json(candidate)
    except ValueError:
        return AssistantResponse(visual_response=raw, spoken_response=raw)
