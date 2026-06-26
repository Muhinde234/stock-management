from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes import cashiers, categories, products, sales

app = FastAPI(title="Stock Management API")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cashiers.router)
app.include_router(sales.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
