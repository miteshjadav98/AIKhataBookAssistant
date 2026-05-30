import os
import json

def getprompt(key: str) -> str:
    config_path = os.path.join(os.path.dirname(__file__), "config", "prompts.json")
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            prompts = json.load(f)
        return prompts.get(key, "")
    except Exception as e:
        print(f"Error loading prompt {key}: {e}")
        return ""
