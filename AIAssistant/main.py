import os
import json
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig

from agent import create_shopkeeper_agent
from sarvamai import SarvamAI

app = FastAPI(title="KhataBook AI Assistant")

# Create the agent instance
agent = create_shopkeeper_agent()

# Initialize SarvamAI client if key exists
sarvam_api_key = os.getenv("SARVAM_API_KEY")
sarvam_client = SarvamAI(api_subscription_key=sarvam_api_key) if sarvam_api_key else None

class ChatRequest(BaseModel):
    message: str
    token: str
    history: List[Dict[str, str]] = []

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    
    # Reconstruct LangChain message history
    messages = []
    for msg in req.history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg.get("content")))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg.get("content")))
            
    # Add the current user message
    messages.append(HumanMessage(content=req.message))
    
    # Configure the tool calls with the JWT token
    config = RunnableConfig(configurable={"token": req.token})
    
    try:
        # Invoke the LangGraph agent
        state = {"messages": messages}
        result = agent.invoke(state, config=config)
        
        # The agent returns the updated state. The last message is the AI response.
        final_message = result["messages"][-1].content
        
        # Try to parse the response as JSON (handle markdown codeblocks if present)
        clean_json_str = final_message.strip()
        if clean_json_str.startswith("```json"):
            clean_json_str = clean_json_str[7:]
        if clean_json_str.startswith("```"):
            clean_json_str = clean_json_str[3:]
        if clean_json_str.endswith("```"):
            clean_json_str = clean_json_str[:-3]
        clean_json_str = clean_json_str.strip()
        
        try:
            parsed_resp = json.loads(clean_json_str)
            visual_response = parsed_resp.get("visual_response", final_message)
            spoken_response = parsed_resp.get("spoken_response", "")
            language_code = parsed_resp.get("language_code", "en-IN")
            
            # Generate Audio via Sarvam AI
            audio_b64 = None
            if sarvam_client and spoken_response:
                try:
                    tts_response = sarvam_client.text_to_speech.convert(
                        text=spoken_response,
                        target_language_code=language_code,
                        model="bulbul:v3"
                    )
                    if hasattr(tts_response, 'audios') and tts_response.audios:
                        audio_b64 = tts_response.audios[0]
                except Exception as tts_err:
                    print(f"TTS Error: {tts_err}")
            
            return {
                "response": visual_response,
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
