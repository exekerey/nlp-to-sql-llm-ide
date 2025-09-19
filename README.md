# ShaiProSQL: Natural Language to SQL Agent

<p align="center">
  <b>🚀 Help us reach 1500 stars! 🚀</b><br>
  <b>Current: <img src="https://img.shields.io/github/stars/daniil-lebedev/shaiprosql?style=social" /> → Goal: 1500 ⭐️</b><br>
  <a href="https://github.com/daniil-lebedev/shaiprosql/stargazers">
</p>

[![Run Locally](https://img.shields.io/badge/Docker-Run_Locally-2496ED?style=flat-square&logo=docker&logoColor=white)](#deployment) [![Self Hosted](https://img.shields.io/badge/Server-Self_Hosted-2EA44F?style=flat-square&logo=serverless&logoColor=white)](#deployment)

ShaiProSQL is a full-stack application that transforms natural language into SQL queries. It provides an intuitive IDE-like experience for interacting with SQL databases, designed for managers and non-developers who want to get insights from their data without writing SQL.

It focuses on one job: **translating your questions into accurate SQL and showing you the results, instantly.**

## Build on Top. In Hours, Not Months

**Build powerful data assistants and BI tools for your startup or for internal use.**

ShaiProSQL provides a solid foundation for building sophisticated data applications. The clear separation between the frontend and the backend allows you to customize the user experience while relying on a powerful and extensible AI core.

<p align="center">
  <img src="https://i.imgur.com/8E0g7g8.png" alt="ShaiProSQL Architecture Flow" width="100%"/>
</p>

- **frontend**: A React-based UI with a chat interface, SQL editor, and results table.
- **backend**: A FastAPI server that handles language processing, SQL generation, and database interaction.

## API Capabilities

The backend exposes a simple REST API for managing conversations and executing queries.

### Initialize a Conversation

This endpoint connects to the database, indexes the schema, and creates a new conversation thread.

```bash
# POST /v1/conversation/init
curl -X POST http://localhost:8000/v1/conversation/init \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "postgres",
    "host": "your-db-host",
    "port": 5432,
    "username": "your-user",
    "password": "your-password",
    "database": "your-db-name"
  }'
```

### Chat and Get SQL

Send a natural language query and get back a response, including the generated SQL.

```bash
# POST /v1/conversation/{thread_id}
curl -X POST http://localhost:8000/v1/conversation/your-thread-id \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Show me the total revenue by product category"
  }'
```

### Execute SQL

Execute a SQL query and get the results.

```bash
# POST /v1/conversation/{thread_id}/sql
curl -X POST http://localhost:8000/v1/conversation/your-thread-id/sql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT category, SUM(revenue) FROM sales GROUP BY category;"
  }'
```

## Coming Next

- [ ] **Support for more SQL Dialects:** Adding support for ClickHouse, and PL/SQL.
- [ ] **More Sophisticated Agent:** Improving the agent's ability to handle complex queries and business-specific logic.
- [ ] **Visualization:** Adding charts and graphs to visualize the query results.
- [ ] **Caching:** Implementing a caching layer to speed up repeated queries.

## Deployment

There are two ways to run this project: using Docker (recommended) or running the frontend and backend separately.

### 1. Docker Setup (Recommended)

This is the easiest way to get the entire application running.

#### Prerequisites

- Docker and Docker Compose
- An OpenAI API key

#### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd shaiprosql
    ```

2.  **Create Environment File:**
    Copy the example environment file. The application expects the `.env` file to be in the project root.
    ```bash
    cp backend/.env.example .env
    ```
    Open the newly created `.env` file and set your `OPENAI_API_KEY`.

3.  **Create Docker Network:**
    This is required for the frontend and backend services to communicate.
    ```bash
    docker network create my-shared-net
    ```

4.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```

5.  **Access the Application:**
    - **Frontend:** `http://localhost:5173`
    - **Backend API:** `http://localhost:8000`

### 2. Local Development Setup

This method allows you to run the services directly on your machine without Docker.

#### Prerequisites

- Node.js (v20+) and npm
- Python (v3.12+) and pip
- An OpenAI API key

#### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment and install dependencies:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the **root of the project**.
    ```bash
    cp .env.example ../.env
    ```
    Edit `../.env` and add your `OPENAI_API_KEY`.

4.  **Run the backend server:**
    ```bash
    uvicorn main:app --reload
    ```

#### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```

## Contributing

Contributors are welcome! Please feel free to open an issue or submit a pull request.

## License

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This project is licensed under the **Apache License, Version 2.0**.