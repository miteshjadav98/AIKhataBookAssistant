import os
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from tools import get_all_tools
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

from prompt_utils import getprompt

SYSTEM_PROMPT = getprompt("system_prompt")

# Global in-memory checkpointer for the agent threads
memory = MemorySaver()

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
    
    # Create the ReAct agent with memory
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SYSTEM_PROMPT,
        checkpointer=memory
    )
    
    return agent
