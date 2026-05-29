"""
Simple in-memory TTL cache for expensive analysis calls.
No external dependencies — just a dict + timestamps.
"""
import time
import threading
from typing import Any

_store: dict[str, tuple[Any, float]] = {}
_lock = threading.Lock()


def cache_get(key: str) -> Any | None:
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del _store[key]
            return None
        return value


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    with _lock:
        _store[key] = (value, time.time() + ttl_seconds)


def cache_invalidate(prefix: str) -> int:
    """Remove all keys starting with prefix. Returns count removed."""
    with _lock:
        keys = [k for k in _store if k.startswith(prefix)]
        for k in keys:
            del _store[k]
        return len(keys)


def cache_stats() -> dict:
    with _lock:
        now = time.time()
        alive = sum(1 for _, (_, exp) in _store.items() if exp > now)
        return {"total_keys": len(_store), "alive_keys": alive}
