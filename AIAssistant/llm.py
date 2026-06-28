"""Chat-model factory with a switchable backend.

LLM_BACKEND selects the assistant's brain:
  - "ollama" (default): Ollama Cloud, OpenAI-compatible (unchanged behavior)
  - "azure":  Azure OpenAI / AI Foundry, OpenAI-compatible v1 endpoint

Voice (Sarvam TTS) is independent of this and is configured in main.py.
"""

import os
from langchain_openai import ChatOpenAI


def current_backend() -> str:
    return os.getenv("LLM_BACKEND", "ollama").lower()


def azure_is_configured() -> bool:
    return bool(os.getenv("AZURE_OPENAI_BASE_URL") and os.getenv("AZURE_OPENAI_API_KEY"))


def build_azure_chat_llm(temperature: float = 0):
    """Azure OpenAI chat model via the OpenAI-compatible v1 endpoint, or None if unconfigured.

    AZURE_OPENAI_BASE_URL should end in /openai/v1/ (e.g.
    https://<resource>.services.ai.azure.com/openai/v1/) and the deployment name is
    passed as the model.
    """
    if not azure_is_configured():
        return None
    return ChatOpenAI(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1"),
        base_url=os.getenv("AZURE_OPENAI_BASE_URL"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=temperature,
    )


def build_ollama_chat_llm(temperature: float = 0):
    return ChatOpenAI(
        model=os.getenv("OLLAMA_MODEL", "gemma4:31b-cloud"),
        base_url=os.getenv("OLLAMA_BASE_URL", "https://ollama.com/v1"),
        api_key=os.getenv("OLLAMA_API_KEY"),
        temperature=temperature,
    )


def build_chat_llm(temperature: float = 0):
    """Return the configured chat model. Falls back to Ollama if Azure is selected but unset."""
    if current_backend() == "azure":
        azure = build_azure_chat_llm(temperature)
        if azure is not None:
            print("[llm] Using Azure OpenAI backend")
            return azure
        print("[llm] LLM_BACKEND=azure but Azure is not configured; falling back to Ollama")
    print("[llm] Using Ollama backend")
    return build_ollama_chat_llm(temperature)
