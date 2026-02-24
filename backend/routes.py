"""
API routes for patient record management.
"""

import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from models import ReportSubmission, PatientRecordResponse
import llm_service
import storage
import rag_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/reports", response_model=PatientRecordResponse)
async def submit_report(submission: ReportSubmission):
    """
    Submit a free-text neonatal report.
    1. Quick-extract fields for RAG matching
    2. RAG: find top-10 similar cases from corpus
    3. LLM: full analysis with RAG context
    4. Store everything (record + dashboard + raw RAG cases with match details)
    """
    # Quick field extraction for RAG
    quick_fields = llm_service._quick_extract(submission.report_text)

    # RAG retrieval (field matching + embedding similarity)
    similar_cases = rag_service.find_similar(quick_fields, top_k=10, query_text=submission.report_text)
    rag_cases_for_storage = [
        rag_service.format_case_for_frontend(case)
        for case in similar_cases[:5]  # Store top 5 for frontend display
    ]

    # LLM call
    try:
        parsed = llm_service.parse_report(submission.report_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse report: {e}")
    except Exception as e:
        logger.error(f"LLM service error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM service error: {str(e)}")

    record_data = {
        "id": str(uuid.uuid4())[:8],
        "created_at": datetime.now().isoformat(),
        "raw_report": submission.report_text,
        "record": parsed.get("record", {}),
        "dashboard": parsed.get("dashboard", {}),
        "rag_cases": rag_cases_for_storage,
    }

    storage.save(record_data)
    return record_data


@router.get("/patients")
async def list_patients() -> list[dict]:
    """Get all stored patient records (with dashboard data)."""
    return storage.load_all()


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str) -> dict:
    """Get a single patient record by ID."""
    record = storage.load_by_id(patient_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return record


@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete a patient record."""
    deleted = storage.delete(patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return {"message": f"Patient {patient_id} deleted", "ok": True}


@router.get("/stats")
async def get_stats():
    """Get RAG corpus statistics."""
    return rag_service.get_corpus_stats()
