# BI-GPT: Your Natural Language to SQL Data Analyst

BI-GPT is an intelligent AI agent designed to empower business leaders and employees to interact with corporate
databases using everyday language. Say goodbye to complex SQL queries and waiting for analysts – simply ask your data
questions in plain English or Russian, and BI-GPT delivers accurate, aggregated insights with clear explanations.

## Key Capabilities & User Benefits

- **Effortless Data Access:** Ask questions like "What was the profit for the last 2 days?" or "Show me monthly margins"
  and receive immediate, relevant data from your corporate database.
- **Intelligent Query Generation:** Our advanced multi-agent system understands your natural language requests,
  intelligently translates them into precise SQL queries, and considers your specific business glossary and rules.
- **Context-Aware Conversations:** Engage in natural, ongoing dialogues. BI-GPT remembers previous interactions,
  allowing you to ask follow-up questions and refine your data exploration seamlessly.
- **Built-in Data Security:** All generated SQL queries undergo rigorous validation to prevent sensitive data (PII)
  leaks, enforce query limits, and ensure safe execution, protecting your valuable information.
- **Database Schema Understanding:** You don't need to know your database's intricate structure. BI-GPT deeply
  understands tables, columns, and relationships, ensuring it generates valid and relevant queries every time.
- **Interactive Data Exploration:** Review the AI-generated SQL, execute it with a click, and instantly view the results
  in a clear, tabular format within an intuitive web interface.
- **Beyond Data Queries:** If your question isn't about data, BI-GPT can engage in friendly conversation, providing a
  versatile and helpful assistant experience.
- **Visual Data Insights (Coming Soon):** Future enhancements will include the ability to generate various charts (pie,
  histogram, line, scatter) directly from your query results, offering visual summaries of your data.

## How It Works (High-Level)

BI-GPT operates on a sophisticated multi-agent graph architecture. When you ask a question:

1. A **Business Analyst Agent** interprets your request and translates it into clear technical requirements.
2. A **Database Administrator Agent** takes these requirements, consults the database schema (which is intelligently
   indexed for context), and generates a safe, optimized SQL query.
3. The SQL query is executed, and the results are presented to you, often with an interpretation from the AI.

This collaborative approach ensures accuracy, security, and efficiency in data retrieval.

## Components

- **Backend (bi-gpt):** The core AI agent, built with Python and FastAPI, orchestrating the multi-agent graph, managing
  database interactions, and handling API requests.
- **Frontend (bi-gpt-chat):** An intuitive web-based user interface (React) for chat, SQL editing, and result display.
- **Dataloader (util scripts):** Utilities for data preprocessing and database population.

## Technology Stack

- **Backend:** Python, FastAPI, LangChain, LangGraph, SQLAlchemy, `chromadb`
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **LLMs:** qwen-3-235b-a22b-instruct-2507
- **Database:** PostgreSQL, MySQL, ClickHouse, Oracle
- **Containerization:** Docker, Docker Compose

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js (v20+)
- Docker and Docker Compose (optional, but recommended)
- An OpenAI API key (and potentially Cerebras, Jina AI keys, see `.env.example`)

### Installation and Running

#### Using Docker Compose (Recommended for quick setup)

1. **Configure Environment:** Create a `.env` file in the `backend` directory by copying `backend/.env.example`. Fill in
   your `OPENAI_API_KEY` and any other required API keys.
2. **Build and Run:** From the project root, execute:
   ```bash
   docker-compose up --build
   ```
3. **Access:** Open your web browser and navigate to `http://localhost:5173`.

#### Local Development

1. **Backend Setup:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # IMPORTANT: Edit .env to add your API keys (e.g., OPENAI_API_KEY)
   uvicorn main:app --reload
   ```

2. **Frontend Setup (in a separate terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The backend will be running on `http://localhost:8000` and the frontend on `http://localhost:5173`.

## Configuration

Backend configuration is managed via environment variables. Refer to `backend/.env.example` for a comprehensive list of
available settings, including API keys for various services and LLM model selections.
