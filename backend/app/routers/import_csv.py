import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.import_report import ImportReportOut
from app.services import import_service

router = APIRouter()

@router.post("", response_model=ImportReportOut)
async def upload_csv(
    group_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
        
    content = await file.read()
    run_id = str(uuid.uuid4())
    
    report = import_service.run_import(db, content, group_id, run_id, current_user.id)
    return report

@router.get("/{run_id}/report", response_model=ImportReportOut)
def get_report(run_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = import_service.get_import_report(db, run_id)
    if not report:
        raise HTTPException(status_code=404, detail="Import run not found")
    return report

@router.post("/{run_id}/resolve/{anomaly_id}")
def resolve_anomaly(run_id: str, anomaly_id: int, action: str = Form(...), corrected_value: str | None = Form(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = import_service.resolve_import_anomaly(db, run_id, anomaly_id, action, corrected_value, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to resolve anomaly. It may not exist, already be resolved, or the resolution data is invalid.")
    return {"message": "Anomaly resolved successfully"}
