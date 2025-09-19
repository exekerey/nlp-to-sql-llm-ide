# Frontend

This directory contains the frontend application, a React-based user interface for the Natural Language to SQL IDE.

## Technology Stack

- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **API Communication:** Axios

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm

### Installation and Development

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be running at `http://localhost:5173` and will connect to the backend server (by default at `http://localhost:8000`).

## Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles the TypeScript and React code for production.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run preview`: Serves the production build locally.
