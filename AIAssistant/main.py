import os
from dotenv import load_dotenv

load_dotenv()
import json
import requests
from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig

from agent import build_agent
from schemas import AssistantResponse, parse_assistant_response
from sarvamai import SarvamAI
import rag

# Cap agent tool-call loops so a confused model can't spin indefinitely.
AGENT_RECURSION_LIMIT = int(os.getenv("AGENT_RECURSION_LIMIT", "15"))

app = FastAPI(title="KhataBook AI Assistant")

# Restrict CORS to known origins. Set CORS_ORIGINS as a comma-separated list, e.g.
#   CORS_ORIGINS=https://app.miteklabs.tech
# Falls back to "*" only when unset (local development).
_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the agent instance (supervisor multi-agent by default; AGENT_MODE=single for legacy)
agent = build_agent()

# Initialize SarvamAI client if key exists
sarvam_api_key = os.getenv("SARVAM_API_KEY")
sarvam_client = SarvamAI(api_subscription_key=sarvam_api_key) if sarvam_api_key else None

class ChatRequest(BaseModel):
    message: str
    token: str
    thread_id: str
    user_name: str = "Shopkeeper"
    history: List[Dict[str, str]] = [] # Kept for backwards compatibility, but not used by backend anymore
    use_sarvam: bool = True

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
async def login_endpoint(req: LoginRequest):
    url = f"{os.getenv('KHATABOOK_API_URL', 'http://localhost:3001')}/auth/login"
    try:
        response = requests.post(url, json={"email": req.email, "password": req.password})
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to KhataBook API: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    if not req.thread_id:
        raise HTTPException(status_code=400, detail="Thread ID required for memory")
    
    print(f"\n--- NEW CHAT REQUEST ---")
    print(f"User Input (STT/Text): {req.message}")
    print(f"User Name: {req.user_name}")
    print(f"Thread ID: {req.thread_id}")
            
    # Configure the tool calls with the JWT token and set the thread_id for LangGraph MemorySaver
    config = RunnableConfig(
        configurable={"token": req.token, "thread_id": req.thread_id},
        recursion_limit=AGENT_RECURSION_LIMIT,
    )
    
    # Inject user name into the message text so the AI knows who it is talking to without modifying the global system prompt
    augmented_message = f"[{req.user_name}]: {req.message}"
    
    try:
        # Invoke the LangGraph agent with just the new message, memory handles the rest!
        # agent.invoke is synchronous and its tools do blocking HTTP, so run it in a
        # threadpool to avoid stalling the FastAPI event loop under concurrency.
        state = {"messages": [HumanMessage(content=augmented_message)]}
        result = await run_in_threadpool(agent.invoke, state, config)

        # The agent returns the updated state. The last message is the AI response.
        final_message = result["messages"][-1].content

        # If structured output is enabled (USE_STRUCTURED_OUTPUT=true) the agent returns a
        # validated AssistantResponse directly; otherwise fall back to parsing the final
        # message. parse_assistant_response never raises — malformed output degrades to text.
        structured = result.get("structured_response")
        if isinstance(structured, AssistantResponse):
            parsed = structured
        else:
            parsed = parse_assistant_response(final_message)

        print(f"API Visual Response: {parsed.visual_response}")
        print(f"API Visual Type: {parsed.visual_type}")
        print(f"Text Converted to Speech: {parsed.spoken_response}")
        print(f"Language Code: {parsed.language_code}")
        print(f"------------------------\n")

        # Generate Audio via Sarvam AI
        audio_b64 = None
        if req.use_sarvam and sarvam_client and parsed.spoken_response:
            try:
                tts_response = sarvam_client.text_to_speech.convert(
                    text=parsed.spoken_response,
                    target_language_code=parsed.language_code,
                    model="bulbul:v3"
                )
                if hasattr(tts_response, 'audios') and tts_response.audios:
                    audio_b64 = tts_response.audios[0]
                    print(">> Successfully generated Sarvam AI Audio Base64.")
            except Exception as tts_err:
                print(f"TTS Error: {tts_err}")

        return {
            "response": parsed.visual_response or final_message,
            "visual_type": parsed.visual_type,
            "data": parsed.data,
            "audio_b64": audio_b64,
            "language": parsed.language_code
        }

    except Exception as e:
        print(f"Error invoking agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/{thread_id}")
async def delete_chat_endpoint(thread_id: str, token: str = None):
    # Require authentication so anonymous callers can't wipe chat threads by guessing IDs.
    # NOTE: This only blocks unauthenticated deletes. Full authorization (ensuring the
    # token's user actually owns this thread) requires a stored user->thread mapping plus
    # JWT verification — see the backend's GET /auth/me recommendation.
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    if not thread_id:
        raise HTTPException(status_code=400, detail="Thread ID required")
    
    print(f"\n--- DELETING CHAT THREAD ---")
    print(f"Thread ID: {thread_id}")
    try:
        from checkpointer import memory
        memory.delete_thread(thread_id)
        print("Successfully deleted thread from Redis.")
        return {"status": "success", "message": "Chat thread deleted"}
    except Exception as e:
        print(f"Error deleting thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kb/upload")
async def upload_to_knowledge_base(
    file: UploadFile = File(...),
    token: str = Form(...),
    thread_id: str = Form(None),
    scope: str = Form("user"),
):
    """Upload a document (invoice PDF/image, policy text) into the knowledge base.

    scope="user" indexes it against this thread_id (private to the conversation);
    scope="global" makes it available to every chat. The agent's knowledge_search_tool
    then retrieves it during chat (RAG).
    """
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    if not rag.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Knowledge base is not configured (set AZURE_OPENAI_BASE_URL and AZURE_OPENAI_API_KEY).",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    # Extraction (and image OCR via the Azure vision model) is blocking — offload it.
    text = await run_in_threadpool(rag.extract_text, data, file.filename, file.content_type)
    if not text or not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the uploaded file.")

    scope_value = thread_id if (scope == "user" and thread_id) else "global"
    metadata = {"source": file.filename, "scope": scope_value}
    chunks = await run_in_threadpool(rag.add_texts, [text], [metadata])

    print(f"[KB upload] {file.filename} -> {chunks} chunk(s), scope={scope_value}")
    return {
        "status": "success",
        "source": file.filename,
        "scope": scope_value,
        "chunks_indexed": chunks,
    }


# Mount static files (Frontend UI)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
