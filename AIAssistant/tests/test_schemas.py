"""Tests for the assistant response contract parser (schemas.py)."""

from schemas import AssistantResponse, parse_assistant_response


def test_parses_plain_json():
    raw = '{"visual_response": "hi", "visual_type": "ledger_summary", "language_code": "hi-IN"}'
    parsed = parse_assistant_response(raw)
    assert isinstance(parsed, AssistantResponse)
    assert parsed.visual_response == "hi"
    assert parsed.visual_type == "ledger_summary"
    assert parsed.language_code == "hi-IN"


def test_parses_fenced_json():
    raw = '```json\n{"visual_response": "ok", "spoken_response": "ok"}\n```'
    parsed = parse_assistant_response(raw)
    assert parsed.visual_response == "ok"
    assert parsed.spoken_response == "ok"


def test_invalid_visual_type_becomes_none():
    raw = '{"visual_response": "x", "visual_type": "made_up_component"}'
    parsed = parse_assistant_response(raw)
    assert parsed.visual_type is None


def test_non_json_falls_back_to_text():
    raw = "Sorry, I could not help with that."
    parsed = parse_assistant_response(raw)
    assert parsed.visual_response == raw
    assert parsed.spoken_response == raw
    assert parsed.visual_type is None


def test_json_with_surrounding_prose():
    raw = 'Here you go: {"visual_response": "done"} hope that helps'
    parsed = parse_assistant_response(raw)
    assert parsed.visual_response == "done"
