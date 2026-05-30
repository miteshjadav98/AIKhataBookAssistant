<div align="center">
  <h1>🌟 AI KhataBook</h1>
  <p><strong>A Next-Generation CRM and AI Voice Assistant Ecosystem for Shopkeepers</strong></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-11.0-ea2845?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</p>

## 📖 Overview

**AI KhataBook** is a comprehensive solution designed to empower local shopkeepers and small businesses with modern digital tools. It combines a robust ledger management system (KhataBook) with an advanced AI Voice Assistant, allowing shopkeepers to interact with their business data naturally through voice commands in multiple regional languages.

## 🏗️ Architecture

The ecosystem is divided into three core microservices:

1. **Frontend (`khatabook-frontend`)**: A modern, responsive web application built with **Next.js** and React 19. It provides an intuitive UI for shopkeepers to manage customers, view ledgers, and interact with the AI assistant.
2. **Backend API (`khatabook-api`)**: A powerful **NestJS** backend powered by **Prisma** and **PostgreSQL**. It handles all CRM operations, authentication, sales tracking, and ledger entries securely.
3. **AI Voice Bot (`AIAssistant`)**: A **FastAPI** application utilizing **LangGraph**, **Ollama**, and **Sarvam AI** for Text-to-Speech (TTS) and Speech-to-Text (STT). It allows shopkeepers to query their shop data conversationally in English, Hindi, or Gujarati.

---

## ✨ Key Features

- 🗣️ **Multilingual Voice Assistant**: Speak naturally in Hindi, Gujarati, or English. The AI automatically detects the language and responds back with a spoken summary in the same language.
- 📊 **Real-time CRM & Ledger**: Securely fetch, update, and manage customer ledgers, stock, and sales data using secure JWT-based API access.
- ⚡ **High Performance**: Leveraging Next.js for lightning-fast frontend delivery and NestJS for reliable and scalable backend operations.
- 🎨 **Modern UI**: Designed with an aesthetically pleasing, responsive interface tailored for ease of use.

---

## 🚀 Getting Started

Follow the instructions below to set up each microservice locally. **Note: Ensure you do not commit any `.env` files with actual credentials to version control.**

### 1. KhataBook API (Backend)

The backend is built with NestJS and Prisma.

```bash
cd khatabook-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run Prisma migrations
npx prisma generate
npx prisma db push

# Start the development server
npm run start:dev
```
*The API will run on `http://localhost:3000`.*

**Environment Variables (`khatabook-api/.env`):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/khatabook?schema=public"
JWT_SECRET="your_secure_jwt_secret_here"
PORT=3000
```

### 2. KhataBook Frontend (Web UI)

The frontend is a Next.js application.

```bash
cd khatabook-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The web app will run on `http://localhost:3001` (or whichever port Next.js assigns).*

**Environment Variables (`khatabook-frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_AI_API_URL="http://localhost:8000"
```

### 3. AI Assistant (Voice Bot)

The AI Voice Assistant requires Python 3.10+.

```bash
cd AIAssistant

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The AI server will run on `http://localhost:8000`.*

**Environment Variables (`AIAssistant/.env`):**
```env
OLLAMA_MODEL="gemma4:31b-cloud"
OLLAMA_BASE_URL="https://ollama.com/v1"
OLLAMA_API_KEY="your_ollama_api_key_here"
KHATABOOK_API_URL="http://localhost:3000"
SARVAM_API_KEY="your_sarvam_api_key_here"
```

---

## 🔒 Security Notice

Please ensure that you **never hardcode or commit** API keys, database credentials, or JWT secrets to this repository. Always use `.env` files and keep them in your `.gitignore`.
