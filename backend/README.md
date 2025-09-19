# Natural Language to SQL IDE

A bolt.new-like application that transforms natural language into SQL queries for Business Intelligence analysis. This tool is designed for managers and non-developers, providing an intuitive IDE-like experience for interacting with SQL databases.

## Features

- **Natural Language to SQL:** A chat interface on the left to convert plain English into SQL queries.
- **SQL Editor:** The AI-generated SQL query is displayed on the top right, allowing users to review and edit the query.
- **Data Table:** The results of the SQL query are displayed in a table at the bottom right.
- **IDE-like Experience:** A familiar and powerful interface for interacting with SQL databases, similar to tools like DataGrip.

## How it Works

1.  **Ask a question:** Type a question in plain English into the chat interface (e.g., "Show me the total revenue for each product category").
2.  **AI generates SQL:** The AI will convert your question into an SQL query.
3.  **Review and edit:** The generated SQL query will appear in the editor on the top right. You can review and edit the query as needed.
4.  **View results:** The results of the SQL query will be displayed in a table at the bottom right.

## Technology Stack

- **Backend:** Python, FastAPI
- **LLM Orchestration:** LangChain
- **LLM:** OpenAI
- **Dependencies:** See `requirements.txt` for a full list of dependencies.

## Getting Started

### Prerequisites

- Python 3.12+
- An OpenAI API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd shaiprosql
    ```

2.  **Create a virtual environment and install dependencies:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Set up your environment variables:**
    Create a `.env` file by copying the `.env.example` file:
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and add your OpenAI API key:
    ```
    OPENAI_API_KEY="your-openai-api-key"
    ```

### Running the Application

To start the FastAPI server, run the following command:

```bash
uvicorn main:app --reload
```

The application will be available at `http://localhost:8000`.

## Usage

Once the application is running, open your web browser and navigate to `http://localhost:8000`. You will see the chat interface, SQL editor, and results table.
