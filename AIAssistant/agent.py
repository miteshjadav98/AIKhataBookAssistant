import os
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from tools import get_all_tools
from dotenv import load_dotenv
from simple_redis_saver import SimpleRedisSaver
from redis import Redis

load_dotenv()

from prompt_utils import getprompt

SYSTEM_PROMPT = getprompt("system_prompt")

# Connect to Redis for persistent LangGraph state memory
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_password = os.getenv("REDIS_PASSWORD", None)
redis_conn = Redis(host=redis_host, port=redis_port, db=0, password=redis_password)
memory = SimpleRedisSaver(redis_conn)

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
