<div align="center">
  <h1>🌟 MitekOne</h1>
  <p><strong>A Next-Generation CRM with an embedded AI Copilot for Shopkeepers</strong></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11.0-ea2845?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</p>

## 📖 Overview

**MitekOne** empowers local shopkeepers and small businesses with modern digital tools. It pairs a full-featured CRM and ledger system with **BizzChat**, an embedded AI Copilot that lets shopkeepers query and manage their business conversationally — by text or voice — in English, Hindi, or Gujarati.

## 🏗️ Architecture

The ecosystem is split into three microservices:

| Service | Stack | Dev Port | Responsibility |
| --- | --- | --- | --- |
| **`khatabook-frontend`** | Next.js 16 (App Router), React 19, TypeScript | **3000** | Responsive CRM UI + the BizzChat AI Copilot |
| **`khatabook-api`** | NestJS, Prisma, PostgreSQL | **3001** | Auth, customers, suppliers, products, sales, purchases, reports, payments, support tickets |
| **`AIAssistant`** | FastAPI, LangGraph, Ollama, Sarvam AI | **8002** | Conversational agent with STT/TTS over the shop's data |

The frontend talks to both backends through **Next.js proxy rewrites** (see `khatabook-frontend/next.config.ts`), so the browser only ever calls same-origin paths:

- `/api/*` → `http://localhost:3001` (CRM API)
- `/ai-api/*` → `http://localhost:8002` (AI Assistant)

---

## ✨ Key Features

### 🤖 BizzChat — AI Copilot
- **Always available**: a floating launcher in the bottom-right corner of every CRM page; the conversation persists as you navigate.
- **Responsive by design**: a resizable 420×650 widget on desktop (drag the top-left grip to resize — your size is remembered) and a full-screen, safe-area-aware experience on mobile/tablet.
- **Voice input**: Web Speech API speech-to-text with an EN / HI / GU language selector; auto-sends when you pause.
- **Spoken replies (TTS)**: Sarvam AI audio with a browser-voice fallback, toggleable from the chat header.
- **Rich answers**: structured cards for ledgers, invoices, sales summaries, and low-stock alerts.
- **Quick actions**: one-tap prompts for today's sales, ledgers, low stock, and outstanding dues.

### 🏢 CRM & Ledger
- Secure JWT auth for shop owners (email/password + Google) and a separate customer login.
- Manage customers, suppliers, products, sales, purchases, and payments.
- Real-time ledgers, stock tracking, reports, and Excel export.
- Built-in **support ticket** system (raise & track from the navbar).

### 🎨 Platform
- Lightweight, theme-aware UI (dark/light) built on CSS variables — no heavy UI framework.
- High performance via Next.js (Turbopack) and a scalable NestJS backend with Redis caching.

---

## 🚀 Getting Started

Set up each microservice locally. **Never commit `.env` files with real credentials.**

### 1. MitekOne API (Backend → port 3001)

```bash
cd khatabook-api
npm install

# Configure environment
cp .env.example .env

# Generate the Prisma client and sync the schema
# NOTE: this project has no migration history — use db push, never `migrate dev`.
npx prisma generate
npx prisma db push

# Start the dev server (watch mode)
npm run start:dev
```
*API runs on `http://localhost:3001` · Swagger docs at `http://localhost:3001/api`.*

**`khatabook-api/.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/khatabook?schema=public"
JWT_SECRET="your_secure_jwt_secret_here"
PORT=3001
# Optional: Redis cache
REDIS_URL="redis://localhost:6379"
```

### 2. MitekOne Frontend (Web UI → port 3000)

```bash
cd khatabook-frontend
npm install
npm run dev
```
*Web app runs on `http://localhost:3000`.*

The frontend proxies API and AI traffic in development, so it works out of the box with no env vars. Override only if your backends run elsewhere:

**`khatabook-frontend/.env.local` (optional):**
```env
# Leave unset to use the built-in proxy (/api → :3001, /ai-api → :8002)
# NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. AI Assistant (Voice Bot → port 8002)

Requires Python 3.10+.

```bash
cd AIAssistant

# Create & activate a virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Start the FastAPI server
python main.py                 # serves on 0.0.0.0:8002 with reload
# or: uvicorn main:app --reload --host 0.0.0.0 --port 8002
```
*AI server runs on `http://localhost:8002`.*

**`AIAssistant/.env`:**
```env
OLLAMA_MODEL="gemma4:31b-cloud"
OLLAMA_BASE_URL="https://ollama.com/v1"
OLLAMA_API_KEY="your_ollama_api_key_here"
KHATABOOK_API_URL="http://localhost:3001"
SARVAM_API_KEY="your_sarvam_api_key_here"
```

---

## 🧭 Running the Full Stack

Start all three services (each in its own terminal), then open **http://localhost:3000**:

```bash
# Terminal 1 — API
cd khatabook-api && npm run start:dev

# Terminal 2 — AI Assistant
cd AIAssistant && python main.py

# Terminal 3 — Frontend
cd khatabook-frontend && npm run dev
```

Log in as a shop owner to reach the dashboard; the **BizzChat** launcher appears bottom-right on every page.

---

## 🔒 Security Notice

**Never hardcode or commit** API keys, database credentials, or JWT secrets. Always use `.env` files and keep them in `.gitignore`.
