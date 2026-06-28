"""Support specialist: operational issues, troubleshooting, and ticket management.

Owns `support_tool` (ticket create/update/status) and reuses the existing
`knowledge_search_tool` for "how does X work" / policy questions during self-resolution.
"""

from agents.base import build_specialist
from prompt_utils import getprompt
from tools.knowledge_tools import knowledge_search_tool
from tools.support_tools import support_tool

SUPPORT_TOOLS = [support_tool, knowledge_search_tool]


def build_support_agent():
    return build_specialist("support_agent", SUPPORT_TOOLS, getprompt("support_agent_prompt"))
