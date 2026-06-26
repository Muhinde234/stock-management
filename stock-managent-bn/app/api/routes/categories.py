from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.category import CategoryCreate, CategoryRead
from app.services import category_service
from app.services.exceptions import ConflictError

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryRead, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    try:
        return category_service.create_category(db, data)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return category_service.list_categories(db)
