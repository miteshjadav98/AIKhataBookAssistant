"""Retrieval-Augmented Generation (knowledge base) for the AI assistant.

Stores embedded documents (policy/T&C docs, uploaded invoices) in a local FAISS
index and exposes similarity search. Embeddings use Azure's text-embedding-3-small
via the OpenAI-compatible v1 endpoint.

Design notes:
  - Heavy/optional deps (faiss, pypdf) are imported lazily so a missing dependency
    degrades the KB feature gracefully instead of crashing app startup.
  - Documents carry a `scope` in metadata: "global" for shared policy docs, or a
    thread_id for user-uploaded files. Search returns global + the caller's scope.
"""

import os
from typing import List, Optional

from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

KB_DIR = os.path.join(os.path.dirname(__file__), "kb_store")
INDEX_NAME = "khatabook_kb"

_store = None  # lazily-loaded FAISS instance (cached)


# --------------------------------------------------------------------------- #
# Configuration / embeddings
# --------------------------------------------------------------------------- #
def is_configured() -> bool:
    """True when Azure embedding credentials are present."""
    return bool(os.getenv("AZURE_OPENAI_BASE_URL") and os.getenv("AZURE_OPENAI_API_KEY"))


def get_embeddings() -> OpenAIEmbeddings:
    if not is_configured():
        raise RuntimeError(
            "Azure embeddings not configured. Set AZURE_OPENAI_BASE_URL and AZURE_OPENAI_API_KEY."
        )
    return OpenAIEmbeddings(
        model=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small"),
        base_url=os.getenv("AZURE_OPENAI_BASE_URL"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    )

# --------------------------------------------------------------------------- #
# Vector store lifecycle
# --------------------------------------------------------------------------- #
def _faiss():
    from langchain_community.vectorstores import FAISS  # lazy: needs faiss-cpu
    return FAISS


def load_store():
    """Load the persisted FAISS store, or None if it doesn't exist / KB unconfigured."""
    global _store
    if _store is not None:
        return _store
    if not is_configured():
        return None
    index_file = os.path.join(KB_DIR, f"{INDEX_NAME}.faiss")
    if os.path.exists(index_file):
        _store = _faiss().load_local(
            KB_DIR,
            get_embeddings(),
            index_name=INDEX_NAME,
            allow_dangerous_deserialization=True,
        )
    return _store


def _save():
    if _store is not None:
        os.makedirs(KB_DIR, exist_ok=True)
        _store.save_local(KB_DIR, index_name=INDEX_NAME)


def _split(text: str) -> List[str]:
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:  # older langchain layout
        from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    return splitter.split_text(text)


def add_texts(texts: List[str], metadatas: Optional[List[dict]] = None) -> int:
    """Chunk, embed and persist the given texts. Returns the number of chunks indexed."""
    global _store
    docs: List[Document] = []
    for i, text in enumerate(texts):
        meta = (metadatas[i] if metadatas and i < len(metadatas) else {}) or {}
        for chunk in _split(text):
            if chunk.strip():
                docs.append(Document(page_content=chunk, metadata=meta))

    if not docs:
        return 0

    store = load_store()
    if store is None:
        _store = _faiss().from_documents(docs, get_embeddings())
    else:
        store.add_documents(docs)
        _store = store
    _save()
    return len(docs)


def search(query: str, k: int = 4, scope: Optional[str] = None) -> List[Document]:
    """Similarity search. When `scope` is given, returns matching-scope + global docs."""
    store = load_store()
    if store is None:
        return []
    # Over-fetch then post-filter by scope (FAISS metadata filtering is best-effort).
    raw = store.similarity_search(query, k=k * 4 if scope else k)
    if scope:
        scoped = [d for d in raw if d.metadata.get("scope") in (scope, "global")]
        return scoped[:k]
    return raw[:k]


# --------------------------------------------------------------------------- #
# Text extraction from uploads
# --------------------------------------------------------------------------- #
def extract_text_from_pdf(data: bytes) -> str:
    from io import BytesIO
    from pypdf import PdfReader  # lazy: needs pypdf
    reader = PdfReader(BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def extract_text_from_image(data: bytes, mime: str = "image/png") -> str:
    """OCR/extract an invoice image into text using the Azure multimodal chat model."""
    import base64
    from langchain_core.messages import HumanMessage
    from llm import build_azure_chat_llm

    vision = build_azure_chat_llm()
    if vision is None:
        return ""
    b64 = base64.b64encode(data).decode()
    message = HumanMessage(content=[
        {
            "type": "text",
            "text": (
                "This is an invoice or business document. Extract ALL text and details "
                "verbatim: shop/customer/supplier names, dates, invoice number, line items "
                "with quantities and prices, totals, taxes, and GSTIN. Output as plain text."
            ),
        },
        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
    ])
    resp = vision.invoke([message])
    return resp.content if isinstance(resp.content, str) else str(resp.content)


def extract_text(data: bytes, filename: str = "", content_type: str = "") -> str:
    """Dispatch text extraction by file type. Returns extracted plain text."""
    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    if name.endswith(".pdf") or "pdf" in ctype:
        return extract_text_from_pdf(data)
    if name.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")) or ctype.startswith("image/"):
        return extract_text_from_image(data, mime=ctype or "image/png")
    # Treat everything else as UTF-8 text (.txt, .md, .csv, ...).
    return data.decode("utf-8", errors="ignore")
