import os
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage
from tools import get_all_tools
from dotenv import load_dotenv
from simple_redis_saver import SimpleRedisSaver
from redis import Redis
from schemas import AssistantResponse
from llm import build_chat_llm

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
    # Switchable backend: LLM_BACKEND=ollama (default) or azure.
    llm = build_chat_llm(temperature=0)

    tools = get_all_tools()

    # Optional: enforce structured output via the model's schema/tool-calling support.
    # Off by default — enable with USE_STRUCTURED_OUTPUT=true once verified with your model.
    # When on, the agent populates result["structured_response"] as an AssistantResponse.
    extra_kwargs = {}
    if os.getenv("USE_STRUCTURED_OUTPUT", "false").lower() == "true":
        extra_kwargs["response_format"] = AssistantResponse

    # Create the ReAct agent with memory
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SYSTEM_PROMPT,
        checkpointer=memory,
        **extra_kwargs,
    )

    return agent
