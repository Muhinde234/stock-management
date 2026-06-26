from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, cashiers, categories, products, sales, stock_movements
from app.core.config import settings

app = FastAPI(title="Stock Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cashiers.router)
app.include_router(sales.router)
app.include_router(stock_movements.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
