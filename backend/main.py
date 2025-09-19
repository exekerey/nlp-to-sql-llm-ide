import uvicorn
from fastapi import FastAPI

from src.agent.graph import graph
from src.api import routes

app = FastAPI()

app.include_router(routes.router)

if __name__ == "__main__":
    graph.build()
    uvicorn.run(app, host="localhost", port=8000)
