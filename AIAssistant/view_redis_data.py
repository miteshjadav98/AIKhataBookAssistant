import os
import json
import pickle
from redis import Redis
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_password = os.getenv("REDIS_PASSWORD", None)

print(f"Connecting to Redis at {redis_host}:{redis_port}...")
redis_conn = Redis(host=redis_host, port=redis_port, db=0, password=redis_password)

try:
    redis_conn.ping()
    print("Connection successful!\n")
except Exception as e:
    print(f"Connection failed: {e}")
    exit(1)

# 1. Show all keys
all_keys = redis_conn.keys("*")
print(f"Found {len(all_keys)} total keys in Redis:")
for k in sorted(all_keys):
    key_str = k.decode('utf-8')
    ttl = redis_conn.ttl(k)
    key_type = redis_conn.type(k).decode('utf-8')
    ttl_str = f"TTL: {ttl}s" if ttl > 0 else ("No expiry" if ttl == -1 else "Expired")
    print(f"  [{key_type.upper():6s}] {key_str}  ({ttl_str})")

print("\n" + "=" * 60)

# 2. Show KhataBook API Cache Data (Keyv-based keys with "cache:" namespace)
cache_keys = redis_conn.keys("cache:*")
if cache_keys:
    print(f"\n📦 KHATABOOK API CACHE ({len(cache_keys)} keys):")
    print("-" * 60)
    for k in sorted(cache_keys):
        key_str = k.decode('utf-8')
        # Remove the "cache:" prefix for display
        display_name = key_str.replace("cache:", "", 1)
        ttl = redis_conn.ttl(k)
        ttl_str = f"{ttl}s remaining" if ttl > 0 else ("No expiry" if ttl == -1 else "Expired")
        
        # Try to read the value
        raw = redis_conn.get(k)
        if raw:
            try:
                val = raw.decode('utf-8')
                # Keyv stores JSON with a "value" and "expires" wrapper
                parsed = json.loads(val)
                if isinstance(parsed, dict) and "value" in parsed:
                    inner = parsed["value"]
                    if isinstance(inner, list):
                        print(f"\n  🔑 {display_name}  ({ttl_str})")
                        print(f"     → Array with {len(inner)} items")
                        # Show first item summary
                        if len(inner) > 0 and isinstance(inner[0], dict):
                            first = inner[0]
                            name = first.get("name", first.get("invoiceNumber", first.get("id", "?")))
                            print(f"     → First: {name}")
                    elif isinstance(inner, dict):
                        print(f"\n  🔑 {display_name}  ({ttl_str})")
                        name = inner.get("name", inner.get("invoiceNumber", inner.get("id", "?")))
                        print(f"     → {name}")
                    else:
                        print(f"\n  🔑 {display_name}  ({ttl_str})")
                        print(f"     → {str(inner)[:100]}")
                else:
                    print(f"\n  🔑 {display_name}  ({ttl_str})")
                    print(f"     → {str(parsed)[:100]}")
            except (json.JSONDecodeError, UnicodeDecodeError):
                print(f"\n  🔑 {display_name}  ({ttl_str})")
                print(f"     → (binary data, {len(raw)} bytes)")
        else:
            print(f"\n  🔑 {display_name}  ({ttl_str})")
            print(f"     → (empty)")
else:
    print("\n📦 KHATABOOK API CACHE: No cached data found.")
    print("   Trigger a cache by calling an API endpoint (e.g., GET /customers)")

# 3. Show LangGraph Chat Memory
print("\n" + "=" * 60)

try:
    from simple_redis_saver import SimpleRedisSaver
    
    print("\n💬 AI ASSISTANT CHAT MEMORY:")
    print("-" * 60)
    saver = SimpleRedisSaver(redis_conn)

    thread_keys = redis_conn.keys("langgraph_thread:*")
    if not thread_keys:
        print("   No chat memory found.")
    else:
        for key in thread_keys:
            thread_id = key.decode('utf-8').split(':', 1)[1]
            print(f"\n  Thread: {thread_id}")
            
            config = {"configurable": {"thread_id": thread_id}}
            
            try:
                checkpoint_tuple = saver.get_tuple(config)
                
                if checkpoint_tuple and "channel_values" in checkpoint_tuple.checkpoint:
                    state = checkpoint_tuple.checkpoint["channel_values"]
                    
                    if "messages" in state:
                        messages = state["messages"]
                        print(f"  Messages: {len(messages)}")
                        # Show last 3 messages
                        for msg in messages[-3:]:
                            sender = getattr(msg, "type", "unknown").upper()
                            if type(msg) is dict:
                                sender = msg.get("type", "unknown").upper()
                                content = msg.get("content", "")
                            else:
                                content = getattr(msg, "content", str(msg))
                            
                            content_preview = str(content)[:80]
                            print(f"    [{sender}]: {content_preview}...")
                    else:
                        print(f"  (No messages in state)")
                        
            except Exception as e:
                print(f"  Error reading thread: {e}")
except ImportError:
    print("\n💬 AI ASSISTANT CHAT MEMORY: (skipped - simple_redis_saver not available)")

print("\n" + "=" * 60)
print("Done!")
