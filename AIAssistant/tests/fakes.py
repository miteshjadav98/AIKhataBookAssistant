"""Deterministic test doubles for LangGraph integration tests."""

from typing import List

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult


class ScriptedToolCallingModel(BaseChatModel):
    """A chat model that replays a pre-scripted list of AIMessages.

    `bind_tools` returns self (the scripted responses already contain the tool_calls), so it
    can drive `create_react_agent` without a real LLM. Each generation pops the next response.
    """

    responses: List[AIMessage]

    def bind_tools(self, tools, **kwargs):  # noqa: ARG002 - tools are pre-scripted
        return self

    def _generate(
        self,
        messages: List[BaseMessage],
        stop=None,
        run_manager: CallbackManagerForLLMRun = None,
        **kwargs,
    ) -> ChatResult:
        message = self.responses.pop(0)
        return ChatResult(generations=[ChatGeneration(message=message)])

    @property
    def _llm_type(self) -> str:
        return "scripted-tool-calling"


class RecordingAgent:
    """Stand-in for a compiled specialist agent: records the config it was invoked with."""

    def __init__(self, reply: str):
        self.reply = reply
        self.captured_config = None
        self.captured_state = None

    def invoke(self, state, config=None):
        self.captured_state = state
        self.captured_config = config
        return {"messages": [AIMessage(content=self.reply)]}
