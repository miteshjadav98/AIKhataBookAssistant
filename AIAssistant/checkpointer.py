"""Shared LangGraph checkpointer (persistent thread memory in Redis).

Extracted into its own module so both the legacy single agent and the new supervisor share a
single Redis connection / saver instance, and so main.py's delete-thread endpoint can import
`memory` without depending on agent construction.
"""

import os

from redis import Redis

from simple_redis_saver import SimpleRedisSaver

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_password = os.getenv("REDIS_PASSWORD", None)

redis_conn = Redis(host=redis_host, port=redis_port, db=0, password=redis_password)

# Persistent LangGraph state memory (one saver shared by every agent path).
memory = SimpleRedisSaver(redis_conn)
