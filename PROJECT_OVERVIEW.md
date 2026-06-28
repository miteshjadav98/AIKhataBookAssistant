# AI KhataBook — Project Overview

> Generated from the graphify knowledge graph (`graphify-out/`, built from commit `7d5c894c`, 525 nodes · 787 edges · 37 communities).

## What it is

**AI KhataBook** is a digital ledger / bookkeeping ("khata") platform for shopkeepers and small businesses, with an AI voice/chat assistant layered on top. It follows a **microservices architecture** ("AI KhataBook Microservices Architecture" hyperedge) split into three deployable services:

| Service | Stack | Role |
|---------|-------|------|
| **Khatabook API** | NestJS + Prisma | Core backend — business logic, data, auth |
| **Khatabook Frontend** | Next.js + React | Web UI for shopkeepers |
| **AI Assistant** | FastAPI + LangGraph | Conversational/voice bot ("shopkeeper agent") |

Data is persisted via **Prisma** (SQL), with **Redis** used for caching and for persisting AI conversation state.

## Backend (Khatabook API — NestJS)

Modular NestJS app (`AppModule`) wiring together feature modules. Core abstractions (the graph's "god nodes") are `PrismaService`, `CustomerService`, `CustomerController`, `AuthService`, and `JwtAuthGuard`.

**Feature modules** (each = Controller + Service + Zod/DTO schemas):

- **Auth** — register, login, Google OAuth (`GoogleAuthDto`), JWT auth (`JwtAuthGuard`), role-based access (`RolesGuard`, `Roles()`)
- **Customer** — customer management, change password, ledgers
- **Product** — product catalog / inventory items
- **Supplier** — supplier records
- **Purchase** — purchase orders (multi-item via `PurchaseItemSchema`)
- **Sales** — sales transactions (multi-item via `SalesItemSchema`)
- **Payment** — payment recording
- **Reports** — report generation & **export utilities** (Excel via `xlsx`)
- **System** — system stats / health (`SystemController`)

**Cross-cutting:** `PrismaModule`/`PrismaService` is the shared data-access hub (bridges nearly every feature module). Caching uses `@nestjs/cache-manager` with Redis (`cache-manager-redis-yet`, `@keyv/redis`). Auth uses `bcrypt` + `jsonwebtoken`.

## AI Assistant (FastAPI + LangGraph)

A **ReAct agent** ("shopkeeper agent") built on **LangGraph**, exposed over **FastAPI**.

**API endpoints** (`main.py`):
- `login_endpoint()` — authenticate (proxies to backend)
- `chat_endpoint()` — main conversational endpoint
- `delete_chat_endpoint()` — clear a conversation

**Agent core** (`agent.py`): `create_shopkeeper_agent()` builds the LangGraph ReAct agent and pulls its capabilities from `get_all_tools()`, with a `dynamic_prompt()` mechanism that injects tool descriptions at runtime.

**Agent tools** (`tools.py`) — the assistant can act on the business via the backend API:
- `customer_tool()` — customer lookups / ledgers
- `inventory_tool()` — stock / product queries
- `supplier_tool()` — supplier info
- `invoice_tool()` — invoices
- `payment_tool()` — payments
- `analytics_tool()` — business analytics / insights

All tools call the backend through a logged HTTP helper (`logged_request()` + `get_headers()`).

**Conversation memory** (`simple_redis_saver.py`): `SimpleRedisSaver` wraps LangGraph's `InMemorySaver` and persists agent state to **Redis** (`get_tuple`, `put`, `put_writes`, `list`), so chat sessions survive restarts.

### RAG (in progress)

The working tree adds a knowledge-base / RAG pipeline not yet in the committed graph: `rag.py`, `ingest_kb.py`, `llm.py`, `schemas.py`, and a `knowledge_base/` directory — extending the assistant with document retrieval.

## Frontend (Next.js)

React/Next.js web UI. A central `apiFetch()` helper (in `src/lib/api.ts`) is the API client used across pages. Notable areas:
- **Auth pages** — Login, Register
- **Customer pages** — customer list / ledger views
- **Dashboard** — cards for `SalesSummary`, `Ledger`, `LowStockAlert`, `InvoicePreview`
- **Layout** — app shell & navbar
- Excel export support (`xlsx`), UUID handling

## Architecture at a glance

```
┌──────────────────┐     ┌─────────────────────┐
│  Next.js Frontend │────▶│   NestJS Khatabook  │
│   (apiFetch)      │     │   API + Prisma (SQL) │
└──────────────────┘     │   + Redis cache      │
         ▲                └─────────┬───────────┘
         │                          │ HTTP (tools)
         │                ┌─────────▼───────────┐
         └───────────────▶│  FastAPI AI Assistant│
            chat/voice    │  LangGraph ReAct agent│
                          │  + Redis state saver  │
                          │  + RAG (WIP)          │
                          └───────────────────────┘
```

## Notes from the graph

- **Cross-community bridges:** `PrismaService` (ties all feature modules together) and `Redis` (bridges the AI agent layer to the backend/Prisma layer).
- **Low cohesion** in `Prisma and Module Setup` / `Customer Controller Logic` communities — candidate areas to refactor into more focused modules if they keep growing.
- To refresh this overview after code changes: `graphify update .` then re-query.
```
