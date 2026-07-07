from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.utils.supabase import supabase

app = FastAPI(title="Panahon AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Panahon AI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/db-test")
def db_test():
    try:
        result = supabase.table("searches").select("*", count="exact").execute()
        return {"status": "connected", "count": result.count}
    except Exception as e:
        return {"status": "error", "message": str(e)}