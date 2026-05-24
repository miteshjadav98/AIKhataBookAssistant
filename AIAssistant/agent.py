import os
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from tools import get_all_tools
from dotenv import load_dotenv

load_dotenv()

# System prompt for the agent
SYSTEM_PROMPT = """You are a helpful and professional AI Assistant for the Khatabook shopkeeper application.
Your goal is to help the shopkeeper manage their business by answering questions about customers, suppliers, sales, and inventory.
You have access to a set of tools that connect to the backend APIs. 
Always use the tools to fetch data before answering. Do NOT make up information.

CRITICAL INSTRUCTIONS:
1. Detect the language of the user's input (it will likely be English, Hindi, or Gujarati).
2. Reply in the EXACT same language the user used. If they switch languages, you switch languages.
3. You MUST output your final answer as a strict JSON object with NO markdown formatting around the JSON block itself.
4. Your JSON must strictly follow this format:
{
  "visual_response": "Full detailed response with markdown formatting, tables, bold text, etc. in the user's language.",
  "spoken_response": "A clean, natural-sounding conversational summary of the result in the user's language. DO NOT include any markdown symbols (*, _, #, |, etc.), URLs, or complex formatting that would sound weird when read aloud by a Text-to-Speech system. Just plain conversational text summarizing the answer.",
  "language_code": "hi-IN" // Use "en-IN" for English, "hi-IN" for Hindi, "gu-IN" for Gujarati
}
"""

def create_shopkeeper_agent():
    """Creates and returns the LangGraph ReAct agent for the shopkeeper."""
    # Using Ollama Cloud (OpenAI compatible)
    llm = ChatOpenAI(
        model=os.getenv("OLLAMA_MODEL", "gemma4:31b-cloud"),
        base_url=os.getenv("OLLAMA_BASE_URL", "https://ollama.com/v1"),
        api_key=os.getenv("OLLAMA_API_KEY"),
        temperature=0
    )
    
    tools = get_all_tools()
    
    # Create the ReAct agent
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SYSTEM_PROMPT
    )
    
    return agent
