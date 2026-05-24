# AI KhataBook CRM

A complete CRM and AI Voice Assistant ecosystem for shopkeepers, featuring:
1. **KhataBook API (`khatabook-api`)**: A robust NestJS backend handling customers, products, sales, and ledgers.
2. **AI Voice Bot (`AIVoiceBot`)**: A command-line prototype for Speech-to-Text and Text-to-Speech using Sarvam AI.
3. **AI Assistant MVP (`AIAssistant`)**: A FastAPI and LangGraph powered conversational web UI where shopkeepers can speak to an AI assistant in English, Hindi, or Gujarati to retrieve shop data directly from the NestJS backend.

## Architecture
- **Backend API**: NestJS, Prisma, PostgreSQL/SQLite.
- **AI Orchestration**: FastAPI, LangGraph, LangChain, Ollama Cloud.
- **Voice AI**: Web Speech API (STT) + Sarvam AI (TTS).
- **Frontend**: HTML5, Vanilla JS, CSS Glassmorphism.

## Setup Instructions

### 1. KhataBook API (NestJS)
```bash
cd khatabook-api
npm install
npm run start:dev
```
Runs on `http://localhost:3000`.

### 2. AI Assistant (FastAPI)
Requires Python 3.10+.
```bash
cd AIAssistant
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in `AIAssistant/` containing:
```
OLLAMA_MODEL="gemma4:31b-cloud"
OLLAMA_BASE_URL="https://ollama.com/v1"
OLLAMA_API_KEY="your_ollama_key"
KHATABOOK_API_URL="http://localhost:3000"
SARVAM_API_KEY="your_sarvam_key"
```

Start the AI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Open your browser to `http://localhost:8000`.

## Features
- **Multi-lingual Voice**: Speak in Hindi, Gujarati, or English. The bot auto-detects and replies with a spoken summary in the same language.
- **Real-time CRM Data**: AI securely pulls ledger, stock, and sales data using shopkeeper JWT tokens.
