
# BI-GPT: Corporate Database Agent (Natural Language → SQL)

---

## Problem/Context

*   Executives want to ask BI questions in natural language (e.g., "profit for the last 2 days," "margin for the month," "average check," "inventory levels").
*   High dependency on BI analysts for even simple queries.
*   Slow response times and a long queue for the BI team.

---

## Goal

An agent that understands natural language (NL) queries, generates safe and accurate SQL, considers the business dictionary, and returns correct aggregates with explanations.

---

## Solution: SQL AI Studio

A web-based IDE that allows non-technical users to interact with corporate databases using natural language.

![SQL AI Studio Screenshot](https://i.imgur.com/your-screenshot.png) 
*Note: Replace with an actual screenshot of the application.*

---

## Key Features

*   **Natural Language to SQL:** A chat interface to convert plain English into SQL queries.
*   **SQL Editor:** AI-generated SQL is displayed in an editor for review and editing.
*   **Data Table:** The results of the SQL query are displayed in a table.
*   **Database Connection:** Supports PostgreSQL, MySQL, and SQLite.
*   **IDE-like Experience:** A familiar and powerful interface for interacting with SQL databases.

---

## How it Works

1.  **Connect to Database:** The user provides their database credentials.
2.  **Ask a question:** The user types a question in plain English into the chat interface.
3.  **AI generates SQL:** The AI converts the question into an SQL query.
4.  **Review and edit:** The user can review and edit the generated SQL query in the editor.
5.  **Execute and View results:** The user executes the query, and the results are displayed in a table.

---

## Architecture

A high-level overview of the system architecture.

```
+-----------------+      +-----------------+      +-----------------+
|   Frontend      | <--> |   Backend       | <--> |   Database      |
|   (React)       |      |   (FastAPI)     |      |   (PostgreSQL,  |
+-----------------+      +-----------------+      |   MySQL, SQLite)|
        ^                      ^                      +-----------------+
        |                      |
        v                      v
+-----------------+      +-----------------+
|   User          |      |   LLM           |
|   (Manager)     |      |   (OpenAI)      |
+-----------------+      +-----------------+
```

---

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Backend:** Python, FastAPI
*   **LLM Orchestration:** LangChain
*   **LLM:** OpenAI
*   **Database:** PostgreSQL, MySQL, SQLite

---

## Metrics & Business Value

### ML/AI Metrics

*   **Exact Match/Exec Accuracy SQL:** Percentage of generated SQL queries that are correct and execute without errors.
*   **Correct Aggregates Rate:** Percentage of correct aggregations on golden queries.
*   **Hallucination Rate:** Rate of the model generating incorrect or fabricated information (to be minimized).

### Business Metrics

*   **Self-Service Rate:** Percentage of questions answered without an analyst's help.
*   **Response Time:** Time from question to answer.
*   **Reduced BI Queue:** Decrease in the number of requests to the BI team.

### Engineering/Security

*   **PII Leakage Prevention:** Ensuring no personally identifiable information is leaked.
*   **Query Time/Cost Limits:** Limiting the execution time and cost of queries.

---

## Live Demo

[Link to live demo or video recording]

---

## Q&A
