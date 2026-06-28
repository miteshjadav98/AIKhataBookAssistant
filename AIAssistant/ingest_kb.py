"""Ingest the static knowledge base (policies, T&C, FAQs) into the vector store.

Run after editing files in ./knowledge_base:

    python ingest_kb.py

Documents are indexed with scope="global" so they're available to every shop's chat.
Requires Azure embedding credentials (AZURE_OPENAI_BASE_URL, AZURE_OPENAI_API_KEY).
"""

import os
from dotenv import load_dotenv

load_dotenv()

import rag

KB_SOURCE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")
SUPPORTED = (".md", ".txt", ".csv", ".pdf")


def main():
    if not rag.is_configured():
        raise SystemExit(
            "Azure embeddings not configured. Set AZURE_OPENAI_BASE_URL and AZURE_OPENAI_API_KEY in .env."
        )

    if not os.path.isdir(KB_SOURCE_DIR):
        raise SystemExit(f"No knowledge_base directory at {KB_SOURCE_DIR}")

    total_chunks = 0
    for filename in sorted(os.listdir(KB_SOURCE_DIR)):
        if not filename.lower().endswith(SUPPORTED):
            continue
        path = os.path.join(KB_SOURCE_DIR, filename)
        with open(path, "rb") as f:
            data = f.read()
        text = rag.extract_text(data, filename=filename)
        if not text.strip():
            print(f"  skip (no text): {filename}")
            continue
        chunks = rag.add_texts([text], [{"source": filename, "scope": "global"}])
        total_chunks += chunks
        print(f"  indexed {chunks} chunk(s): {filename}")

    print(f"\nDone. {total_chunks} chunk(s) added to the knowledge base at {rag.KB_DIR}")


if __name__ == "__main__":
    main()
