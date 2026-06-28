"""Multi-agent package: a Supervisor that delegates to domain specialists.

See agents/supervisor/supervisor.py for the orchestration entrypoint (`build_supervisor`).
Each specialist lives in its own subpackage and exposes a `build_*_agent()` factory plus the
list of tools it owns.
"""
