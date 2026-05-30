import os
import json
import requests
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig

from agent import create_shopkeeper_agent
from sarvamai import SarvamAI

app = FastAPI(title="KhataBook AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the agent instance
agent = create_shopkeeper_agent()

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
    url = f"{os.getenv('KHATABOOK_API_URL', 'http://localhost:3000')}/auth/login"
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
    config = RunnableConfig(configurable={"token": req.token, "thread_id": req.thread_id})
    
    # Inject user name into the message text so the AI knows who it is talking to without modifying the global system prompt
    augmented_message = f"[{req.user_name}]: {req.message}"
    
    try:
        # Invoke the LangGraph agent with just the new message, memory handles the rest!
        state = {"messages": [HumanMessage(content=augmented_message)]}
        result = agent.invoke(state, config=config)
        
        # The agent returns the updated state. The last message is the AI response.
        final_message = result["messages"][-1].content
        
        # Try to parse the response as JSON by extracting the JSON object
        clean_json_str = final_message.strip()
        start_idx = clean_json_str.find('{')
        end_idx = clean_json_str.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
            clean_json_str = clean_json_str[start_idx:end_idx+1]
        
        try:
            parsed_resp = json.loads(clean_json_str)
            visual_response = parsed_resp.get("visual_response", final_message)
            visual_type = parsed_resp.get("visual_type")
            data = parsed_resp.get("data")
            spoken_response = parsed_resp.get("spoken_response", "")
            language_code = parsed_resp.get("language_code", "en-IN")
            
            print(f"API Visual Response: {visual_response}")
            print(f"API Visual Type: {visual_type}")
            print(f"Text Converted to Speech: {spoken_response}")
            print(f"Language Code: {language_code}")
            print(f"------------------------\n")
            
            # Generate Audio via Sarvam AI
            audio_b64 = None
            if req.use_sarvam and sarvam_client and spoken_response:
                try:
                    tts_response = sarvam_client.text_to_speech.convert(
                        text=spoken_response,
                        target_language_code=language_code,
                        model="bulbul:v3"
                    )
                    if hasattr(tts_response, 'audios') and tts_response.audios:
                        audio_b64 = tts_response.audios[0]
                        print(">> Successfully generated Sarvam AI Audio Base64.")
                except Exception as tts_err:
                    print(f"TTS Error: {tts_err}")
            
            return {
                "response": visual_response,
                "visual_type": visual_type,
                "data": data,
                "audio_b64": audio_b64,
                "language": language_code
            }
            
        except json.JSONDecodeError:
            # Fallback if LLM didn't return valid JSON
            print("Failed to parse JSON, falling back to raw response.")
            return {"response": final_message}
            
    except Exception as e:
        print(f"Error invoking agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files (Frontend UI)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
