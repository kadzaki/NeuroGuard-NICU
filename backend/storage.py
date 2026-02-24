"""
Local JSON file storage for patient records.
Thread-safe file-based persistence using a simple lock mechanism.
"""

import json
import os
import threading
import logging
from typing import Optional

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATA_FILE = os.path.join(DATA_DIR, "patients.json")

_lock = threading.Lock()


def _ensure_data_dir():
    """Create the data directory and file if they don't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def load_all() -> list[dict]:
    """Load all patient records from the JSON file."""
    with _lock:
        _ensure_data_dir()
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, FileNotFoundError):
            logger.warning("Data file corrupted or missing, returning empty list")
            return []


def load_by_id(patient_id: str) -> Optional[dict]:
    """Load a single patient record by ID."""
    records = load_all()
    for record in records:
        if record.get("id") == patient_id:
            return record
    return None


def save(record: dict) -> dict:
    """
    Save a new patient record. Adds it to the existing records.
    
    Args:
        record: The patient record dictionary (must include 'id').
        
    Returns:
        The saved record.
    """
    with _lock:
        _ensure_data_dir()
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)
                if not isinstance(records, list):
                    records = []
        except (json.JSONDecodeError, FileNotFoundError):
            records = []

        # Check for duplicate ID and update if exists
        existing_idx = None
        for i, r in enumerate(records):
            if r.get("id") == record.get("id"):
                existing_idx = i
                break

        if existing_idx is not None:
            records[existing_idx] = record
        else:
            records.append(record)

        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved patient record {record.get('id')}")
        return record


def delete(patient_id: str) -> bool:
    """
    Delete a patient record by ID.
    
    Returns:
        True if a record was deleted, False if not found.
    """
    with _lock:
        _ensure_data_dir()
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)
                if not isinstance(records, list):
                    records = []
        except (json.JSONDecodeError, FileNotFoundError):
            return False

        original_length = len(records)
        records = [r for r in records if r.get("id") != patient_id]

        if len(records) == original_length:
            return False

        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        logger.info(f"Deleted patient record {patient_id}")
        return True
