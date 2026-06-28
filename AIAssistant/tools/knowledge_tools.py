"""Knowledge-base search tool (RAG).

Preserved as-is from the original monolithic tools module so the existing
/api/kb/upload feature keeps working. No new RAG capability is added in this phase.
"""

from langchain_core.runnables.config import RunnableConfig

from .common import _err, _ok, dynamic_prompt


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
