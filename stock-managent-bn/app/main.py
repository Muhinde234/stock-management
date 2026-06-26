from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, cashiers, categories, products, sales
from app.core.config import settings

app = FastAPI(title="Stock Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("static/uploads").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cashiers.router)
app.include_router(sales.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
