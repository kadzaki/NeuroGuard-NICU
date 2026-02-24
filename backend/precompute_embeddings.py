"""
Precompute embeddings for all patient records in the RAG corpus.

Uses EmbeddingGemma via llama.cpp's /v1/embeddings endpoint.
Saves embeddings as a numpy array for fast cosine similarity at query time.

Prerequisites:
    Start EmbeddingGemma:
    llama-server -m <embedding-gemma.gguf> --port 8081 --embedding

Usage:
    cd backend
    python precompute_embeddings.py
"""

import os
import json
import logging
import numpy as np
import requests
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

RAG_DATA_DIR = os.path.join(os.path.dirname(__file__), "rag_data")
EMBEDDINGS_FILE = os.path.join(RAG_DATA_DIR, "embeddings.npy")
INDEX_FILE = os.path.join(RAG_DATA_DIR, "embeddings_index.json")

# Batch size for embedding API calls
BATCH_SIZE = 100


# ── Text fields to concatenate for embedding ──
TEXT_FIELDS = [
    "diagnostic_admission", "diagnostic_sortie", "raison_admission",
    "MEC", "antécédent_mère", "anamnèse_infectieuse",
    "plan_infectieux", "plan_digestive", "plan_métabolique",
    "bilan_malformatif", "radio_thorax", "ETF",
    "MV", "râles_auscultation", "thorax_morphologie",
    "abdomen", "hémoculture",
]

# Structured fields to include as key-value text
STRUCTURED_FIELDS = [
    ("sexe_nouveau_né", "Sexe"),
    ("poids", "Poids"),
    ("dubowitz", "Âge gestationnel"),
    ("voie_accouchement", "Voie accouchement"),
    ("APGAR_naissance", "APGAR"),
    ("CRP", "CRP"),
    ("type_mariage", "Type mariage"),
    ("date_décès", "Décédé"),
]


def record_to_text(record: dict) -> str:
    """
    Convert a patient record to a single text string suitable for embedding.
    Combines structured fields as "Label: Value" pairs and free-text fields.
    """
    parts = []

    # Structured fields as "Label: Value"
    for field_key, label in STRUCTURED_FIELDS:
        val = record.get(field_key)
        if val is not None and str(val).strip() not in ("", "None"):
            parts.append(f"{label}: {val}")

    # Free-text fields
    for field_key in TEXT_FIELDS:
        val = record.get(field_key)
        if val is not None and str(val).strip() not in ("", "None"):
            parts.append(str(val))

    return " | ".join(parts) if parts else ""


def embed_batch(base_url: str, texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using EmbeddingGemma via llama.cpp."""
    url = f"{base_url}/v1/embeddings"

    resp = requests.post(url, json={"input": texts}, timeout=120)
    resp.raise_for_status()

    data = resp.json()
    # Sort by index to preserve order
    sorted_data = sorted(data["data"], key=lambda x: x["index"])
    return [d["embedding"] for d in sorted_data]


def main():
    base_url = os.getenv("EMBEDDING_BASE_URL", "http://localhost:8081")
    logger.info(f"Embedding server: {base_url}")
    logger.info(f"RAG data dir: {RAG_DATA_DIR}")

    # Verify connection
    try:
        requests.get(f"{base_url}/health", timeout=5)
    except requests.ConnectionError:
        logger.error(
            f"Cannot connect to embedding server at {base_url}. "
            "Start EmbeddingGemma: llama-server -m <embedding-gemma.gguf> --port 8081 --embedding"
        )
        return

    # Load all records
    filenames = sorted(f for f in os.listdir(RAG_DATA_DIR) if f.endswith(".json"))

    # Exclude the index file itself
    filenames = [f for f in filenames if f != "embeddings_index.json"]

    logger.info(f"Found {len(filenames)} patient records")

    # Convert records to text
    texts = []
    valid_filenames = []
    for filename in filenames:
        filepath = os.path.join(RAG_DATA_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                record = json.load(f)
            text = record_to_text(record)
            if text:
                texts.append(text)
                valid_filenames.append(filename)
            else:
                logger.warning(f"Skipping {filename}: no text content")
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Skipping {filename}: {e}")

    logger.info(f"Will embed {len(texts)} records (skipped {len(filenames) - len(texts)})")

    # Embed in batches
    all_embeddings = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(texts) + BATCH_SIZE - 1) // BATCH_SIZE

        logger.info(f"Embedding batch {batch_num}/{total_batches} ({len(batch)} records)...")
        embeddings = embed_batch(base_url, batch)
        all_embeddings.extend(embeddings)
        logger.info(f"  ✓ Batch {batch_num} done")

    # Save as numpy array
    embeddings_array = np.array(all_embeddings, dtype=np.float32)
    np.save(EMBEDDINGS_FILE, embeddings_array)
    logger.info(f"Saved embeddings: {EMBEDDINGS_FILE} (shape: {embeddings_array.shape})")

    # Save filename index
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(valid_filenames, f, indent=2)
    logger.info(f"Saved index: {INDEX_FILE} ({len(valid_filenames)} entries)")

    logger.info("Done! Embeddings are ready for RAG retrieval.")


if __name__ == "__main__":
    main()
