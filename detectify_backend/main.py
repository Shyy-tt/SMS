from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

from routes import auth, messages, blocked

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Detectify API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(blocked.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Detectify API"}