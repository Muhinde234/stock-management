from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import NotificationRead, UnreadCountRead
from app.services import notification_service
from app.services.exceptions import NotFoundError

router = APIRouter(prefix="/notifications", tags=["notifications"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.list_notifications(
        db, current_user.id, unread_only=unread_only, skip=skip, limit=limit
    )


@router.get("/unread-count", response_model=UnreadCountRead)
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UnreadCountRead(unread_count=notification_service.get_unread_count(db, current_user.id))


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return notification_service.mark_read(db, notification_id, current_user.id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification_service.mark_all_read(db, current_user.id)
