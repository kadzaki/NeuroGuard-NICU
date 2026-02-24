"""
RAG retrieval service: finds similar patient reports from the local corpus.

Hybrid approach:
  1. Field-based matching (weight, GA, sex, outcome, CRP, diagnosis, etc.)
  2. Embedding-based semantic similarity (EmbeddingGemma via llama.cpp)

Final score = 0.6 × field_score + 0.4 × embedding_score
Falls back to field-only if embeddings are not precomputed.

Returns per-field match details for highlighting in the frontend.
"""

import os
import json
import logging
import re
from typing import Optional

import numpy as np
import requests as http_requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

RAG_DATA_DIR = os.path.join(os.path.dirname(__file__), "rag_data")
EMBEDDINGS_FILE = os.path.join(RAG_DATA_DIR, "embeddings.npy")
INDEX_FILE = os.path.join(RAG_DATA_DIR, "embeddings_index.json")

# Blend weights: field vs embedding
FIELD_WEIGHT = 0.6
EMBEDDING_WEIGHT = 0.4

# Cache loaded reports in memory (loaded once at startup)
_corpus: list[dict] = []
_corpus_loaded = False

# Cache embeddings (loaded once at startup)
_embeddings: Optional[np.ndarray] = None
_embeddings_index: list[str] = []
_embeddings_loaded = False

# Human-readable labels for fields
FIELD_LABELS = {
    "poids": "Poids",
    "sexe_nouveau_né": "Sexe",
    "dubowitz": "Âge Gestationnel",
    "date_décès": "Issue (décès)",
    "voie_accouchement": "Voie d'accouchement",
    "type_mariage": "Consanguinité",
    "CRP": "CRP",
    "diagnostic_admission": "Diagnostic admission",
    "diagnostic_sortie": "Diagnostic sortie",
    "APGAR_naissance": "APGAR",
    "NFS_hb": "NFS Hb",
    "date_entrée": "Date d'entrée",
    "date_sortie": "Date de sortie",
    "date_naissance": "Date de naissance",
    "âge_mère": "Âge mère",
    "antécédent_mère": "Antécédents mère",
    "type_grossesse": "Type grossesse",
    "suivi_grossesse": "Suivi grossesse",
    "grossesse_mené_à_terme": "Grossesse à terme",
    "type_accouchement": "Type accouchement",
    "anamnèse_infectieuse": "Anamnèse infectieuse",
    "groupage_maman": "Groupage maman",
    "couleur": "Couleur",
    "tonicité": "Tonicité",
    "réactivité": "Réactivité",
    "RSD": "RSD",
    "RA": "RA",
    "hémodynamique_FC": "FC",
    "hémodynamique_TRC": "TRC",
    "respiratoire_SS": "Score Silverman",
    "respiratoire_SaO2": "SaO2",
    "respiratoire_FR": "FR",
    "glycémie_capillaire": "Glycémie capillaire",
    "taille": "Taille",
    "périmètre_crânien": "Périmètre crânien",
    "MV": "MV",
    "râles_auscultation": "Râles",
    "abdomen": "Abdomen",
    "HSMG": "HSMG",
    "B1B2": "B1 B2",
    "souffle_surajouté": "Souffle",
    "OGE_sexe": "OGE",
    "testicules": "Testicules",
    "bilan_malformatif": "Bilan malformatif",
    "radio_thorax": "Radio thorax",
    "MEC": "Mise en condition",
    "plaquettes": "Plaquettes",
    "urée": "Urée",
    "créat": "Créat",
    "ionogramme_Nat": "Na+",
    "ionogramme_K_plus": "K+",
    "GB": "GB",
    "ETF": "ETF",
    "PNN": "PNN",
    "CPK": "CPK",
    "ECBU": "ECBU",
    "lymphopénie": "Lymphopénie",
    "LDH": "LDH",
    "calcémie": "Calcémie",
    "albuminémie": "Albuminémie",
    "TP": "TP",
    "raison_admission": "Raison d'admission",
    "nombre_fausses_accouchement": "Fausses couches",
    "degré_consanguinité": "Degré consanguinité",
    "ville_origine": "Ville",
    "couverture_sanitaire": "Couverture sanitaire",
    "plan_infectieux": "Plan infectieux",
    "plan_digestive": "Plan digestif",
    "plan_métabolique": "Plan métabolique",
    "hémoculture": "Hémoculture",
    "thorax_morphologie": "Thorax",
}

# Fields used for matching (and their display order / grouping)
MATCH_FIELDS = [
    # (field_key, category)
    ("poids", "Identité"),
    ("sexe_nouveau_né", "Identité"),
    ("dubowitz", "Identité"),
    ("date_décès", "Issue"),
    ("voie_accouchement", "Accouchement"),
    ("type_mariage", "Famille"),
    ("CRP", "Biologie"),
    ("diagnostic_admission", "Diagnostic"),
    ("diagnostic_sortie", "Diagnostic"),
]


def _load_corpus():
    """Load all 1230 patient reports into memory."""
    global _corpus, _corpus_loaded
    if _corpus_loaded:
        return

    if not os.path.isdir(RAG_DATA_DIR):
        logger.warning(f"RAG data directory not found: {RAG_DATA_DIR}")
        _corpus_loaded = True
        return

    count = 0
    for filename in os.listdir(RAG_DATA_DIR):
        if not filename.endswith(".json") or filename == "embeddings_index.json":
            continue
        filepath = os.path.join(RAG_DATA_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                record = json.load(f)
                record["_source_file"] = filename
                _corpus.append(record)
                count += 1
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Skipping {filename}: {e}")

    _corpus_loaded = True
    logger.info(f"RAG corpus loaded: {count} patient reports")

    # Also load embeddings if available
    _load_embeddings()


def _load_embeddings():
    """Load precomputed embeddings if available."""
    global _embeddings, _embeddings_index, _embeddings_loaded
    if _embeddings_loaded:
        return

    if not os.path.exists(EMBEDDINGS_FILE) or not os.path.exists(INDEX_FILE):
        logger.info("No precomputed embeddings found — using field-only matching")
        _embeddings_loaded = True
        return

    try:
        _embeddings = np.load(EMBEDDINGS_FILE)
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            _embeddings_index = json.load(f)

        # Normalize embeddings for fast cosine similarity (dot product)
        norms = np.linalg.norm(_embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1  # avoid division by zero
        _embeddings = _embeddings / norms

        logger.info(f"Embeddings loaded: {_embeddings.shape[0]} vectors, dim={_embeddings.shape[1]}")
    except Exception as e:
        logger.error(f"Failed to load embeddings: {e}")
        _embeddings = None
        _embeddings_index = []

    _embeddings_loaded = True


def embed_text(text: str) -> Optional[np.ndarray]:
    """
    Embed a single text string using EmbeddingGemma via llama.cpp.
    Returns a normalized numpy vector, or None on failure.
    """
    if not text.strip():
        return None

    base_url = os.getenv("EMBEDDING_BASE_URL", "http://localhost:8081")
    url = f"{base_url}/v1/embeddings"

    try:
        resp = http_requests.post(url, json={"input": [text]}, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        vec = np.array(data["data"][0]["embedding"], dtype=np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec
    except http_requests.ConnectionError:
        logger.warning(f"Cannot connect to embedding server at {base_url}")
        return None
    except Exception as e:
        logger.error(f"Embedding API error: {e}")
        return None


def _compute_embedding_scores(query_text: str) -> dict[str, float]:
    """
    Compute cosine similarity between query text and all precomputed embeddings.
    Returns a dict mapping source_file -> similarity score (0-100).
    """
    if _embeddings is None or len(_embeddings_index) == 0:
        return {}

    query_vec = embed_text(query_text)
    if query_vec is None:
        return {}

    # Cosine similarity via dot product (vectors are pre-normalized)
    similarities = _embeddings @ query_vec  # shape: (N,)

    # Convert from [-1, 1] to [0, 100]
    scores = ((similarities + 1) / 2 * 100).clip(0, 100)

    return {
        filename: float(scores[i])
        for i, filename in enumerate(_embeddings_index)
    }


def _parse_weight(val) -> Optional[float]:
    """Extract numeric weight from various formats."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    try:
        cleaned = str(val).replace("g", "").replace("kg", "").replace(",", ".").strip()
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def _parse_numeric(val) -> Optional[float]:
    """Extract a numeric value from mixed input."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    try:
        cleaned = str(val).replace(",", ".").strip()
        match = re.search(r"[\d]+\.?[\d]*", cleaned)
        if match:
            return float(match.group())
    except (ValueError, TypeError):
        pass
    return None


def _compute_similarity_detailed(query: dict, candidate: dict) -> dict:
    """
    Compute a similarity score (0–100) between two records.
    Returns both the total score AND per-field match details.
    """
    matches: list[dict] = []
    score = 0.0
    max_score = 0.0

    # --- Weight ---
    w_query = _parse_weight(query.get("poids"))
    w_cand = _parse_weight(candidate.get("poids"))
    if w_query is not None and w_cand is not None:
        wq = w_query * 1000 if w_query < 100 else w_query
        wc = w_cand * 1000 if w_cand < 100 else w_cand
        diff = abs(wq - wc) / max(wq, wc, 1)
        field_score = (1 - diff) * 25
        score += field_score
        strength = "high" if diff < 0.15 else "medium" if diff < 0.3 else "low"
        matches.append({
            "field": "poids",
            "label": "Poids",
            "queryValue": str(query.get("poids")),
            "candidateValue": str(candidate.get("poids")),
            "strength": strength,
            "reason": f"Différence: {abs(wq - wc):.0f}g ({diff*100:.0f}%)",
        })
    max_score += 25

    # --- Sex ---
    sex_q = str(query.get("sexe_nouveau_né", "")).lower()
    sex_c = str(candidate.get("sexe_nouveau_né", "")).lower()
    if sex_q and sex_c and sex_q != "none" and sex_c != "none":
        matched = sex_q == sex_c
        if matched:
            score += 10
        matches.append({
            "field": "sexe_nouveau_né",
            "label": "Sexe",
            "queryValue": str(query.get("sexe_nouveau_né", "")),
            "candidateValue": str(candidate.get("sexe_nouveau_né", "")),
            "strength": "high" if matched else "none",
            "reason": "Match exact" if matched else "Différent",
        })
    max_score += 10

    # --- Gestational age ---
    ga_q = _parse_numeric(query.get("dubowitz"))
    ga_c = _parse_numeric(candidate.get("dubowitz"))
    if ga_q is not None and ga_c is not None:
        diff = abs(ga_q - ga_c)
        if diff <= 2:
            score += 20
            strength = "high"
        elif diff <= 4:
            score += 12
            strength = "medium"
        elif diff <= 6:
            score += 5
            strength = "low"
        else:
            strength = "none"
        matches.append({
            "field": "dubowitz",
            "label": "Âge Gestationnel",
            "queryValue": str(query.get("dubowitz", "")),
            "candidateValue": str(candidate.get("dubowitz", "")),
            "strength": strength,
            "reason": f"Écart: {diff:.0f} semaines",
        })
    max_score += 20

    # --- Outcome ---
    dec_q = query.get("date_décès")
    dec_c = candidate.get("date_décès")
    q_deceased = dec_q is not None and str(dec_q).strip() != ""
    c_deceased = dec_c is not None and str(dec_c).strip() != ""
    same_outcome = q_deceased == c_deceased
    if same_outcome:
        score += 10
    matches.append({
        "field": "date_décès",
        "label": "Issue (décès)",
        "queryValue": "Décédé" if q_deceased else "Survivant",
        "candidateValue": "Décédé" if c_deceased else "Survivant",
        "strength": "high" if same_outcome else "none",
        "reason": "Même issue" if same_outcome else "Issue différente",
    })
    max_score += 10

    # --- Delivery route ---
    voie_q = str(query.get("voie_accouchement", "")).lower()
    voie_c = str(candidate.get("voie_accouchement", "")).lower()
    if voie_q and voie_c and voie_q != "none" and voie_c != "none":
        matched = ("haute" in voie_q and "haute" in voie_c) or ("basse" in voie_q and "basse" in voie_c)
        if matched:
            score += 5
        matches.append({
            "field": "voie_accouchement",
            "label": "Voie d'accouchement",
            "queryValue": str(query.get("voie_accouchement", "")),
            "candidateValue": str(candidate.get("voie_accouchement", "")),
            "strength": "high" if matched else "none",
            "reason": "Même voie" if matched else "Voie différente",
        })
    max_score += 5

    # --- Consanguinity ---
    consang_q = str(query.get("type_mariage", "")).lower()
    consang_c = str(candidate.get("type_mariage", "")).lower()
    if consang_q and consang_c and consang_q != "none" and consang_c != "none":
        q_consang = "consanguin" in consang_q and "non" not in consang_q
        c_consang = "consanguin" in consang_c and "non" not in consang_c
        matched = q_consang == c_consang
        if matched:
            score += 5
        matches.append({
            "field": "type_mariage",
            "label": "Consanguinité",
            "queryValue": str(query.get("type_mariage", "")),
            "candidateValue": str(candidate.get("type_mariage", "")),
            "strength": "high" if matched else "none",
            "reason": "Même type" if matched else "Type différent",
        })
    max_score += 5

    # --- CRP ---
    crp_q = _parse_numeric(query.get("CRP"))
    crp_c = _parse_numeric(candidate.get("CRP"))
    if crp_q is not None and crp_c is not None:
        diff = abs(crp_q - crp_c) / max(crp_q, crp_c, 1)
        field_score = (1 - min(diff, 1)) * 10
        score += field_score
        strength = "high" if diff < 0.2 else "medium" if diff < 0.5 else "low"
        matches.append({
            "field": "CRP",
            "label": "CRP",
            "queryValue": str(query.get("CRP")),
            "candidateValue": str(candidate.get("CRP")),
            "strength": strength,
            "reason": f"Différence: {diff*100:.0f}%",
        })
    max_score += 10

    # --- Diagnosis keywords ---
    diag_q = str(query.get("diagnostic_admission", "") or "") + " " + str(query.get("diagnostic_sortie", "") or "")
    diag_c = str(candidate.get("diagnostic_admission", "") or "") + " " + str(candidate.get("diagnostic_sortie", "") or "")
    if diag_q.strip() and diag_c.strip():
        words_q = set(diag_q.lower().split())
        words_c = set(diag_c.lower().split())
        overlap = words_q & words_c
        # Remove very common short words
        overlap = {w for w in overlap if len(w) > 2}
        if overlap:
            field_score = min(len(overlap) * 3, 15)
            score += field_score
            strength = "high" if len(overlap) >= 3 else "medium" if len(overlap) >= 1 else "none"
            matches.append({
                "field": "diagnostic",
                "label": "Diagnostic",
                "queryValue": diag_q.strip(),
                "candidateValue": diag_c.strip(),
                "strength": strength,
                "reason": f"Mots communs: {', '.join(sorted(overlap))}",
                "highlightWords": sorted(overlap),
            })
    max_score += 15

    total = round((score / max_score) * 100, 1) if max_score > 0 else 0

    return {
        "similarity_score": total,
        "matches": matches,
    }


def find_similar(query_record: dict, top_k: int = 10, query_text: str = "") -> list[dict]:
    """
    Find the top-k most similar patient reports from the RAG corpus.

    Uses a hybrid approach:
      1. Field-based matching (structured clinical fields)
      2. Embedding-based semantic similarity (if precomputed embeddings exist)
      3. Blended score: 0.6 × field + 0.4 × embedding

    Args:
        query_record: dict of extracted clinical fields for field matching
        top_k: number of results to return
        query_text: raw report text for embedding similarity (optional)

    Returns list of dicts, each with:
      - similarity_score: float (0-100) — blended score
      - field_score: float (0-100)
      - embedding_score: float (0-100) or None
      - record: full record dict
      - matches: list of per-field match details (for frontend highlighting)
    """
    _load_corpus()

    if not _corpus:
        logger.warning("RAG corpus is empty")
        return []

    # Step 1: Compute embedding scores (if available)
    embedding_scores: dict[str, float] = {}
    use_embeddings = _embeddings is not None and query_text.strip()
    if use_embeddings:
        embedding_scores = _compute_embedding_scores(query_text)
        logger.info(f"Embedding scores computed for {len(embedding_scores)} candidates")

    # Step 2: Compute field scores + blend
    scored = []
    for candidate in _corpus:
        result = _compute_similarity_detailed(query_record, candidate)
        field_score = result["similarity_score"]

        source_file = candidate.get("_source_file", "")
        emb_score = embedding_scores.get(source_file)

        if emb_score is not None:
            blended = FIELD_WEIGHT * field_score + EMBEDDING_WEIGHT * emb_score
        else:
            blended = field_score  # fallback to field-only

        scored.append({
            "similarity_score": round(blended, 1),
            "field_score": round(field_score, 1),
            "embedding_score": round(emb_score, 1) if emb_score is not None else None,
            "matches": result["matches"],
            "record": candidate,
        })

    scored.sort(key=lambda x: x["similarity_score"], reverse=True)

    if use_embeddings:
        top = scored[:3] if scored else []
        for s in top:
            logger.info(
                f"  Top match: {s['record'].get('_source_file', '?')} "
                f"blend={s['similarity_score']} field={s['field_score']} "
                f"emb={s['embedding_score']}"
            )

    return scored[:top_k]


def format_case_for_frontend(case: dict) -> dict:
    """
    Format a RAG case for the frontend, including all fields with labels
    and match highlight metadata.
    """
    record = case["record"]
    matches = case.get("matches", [])
    match_fields = {m["field"] for m in matches if m["strength"] != "none"}

    # Build a list of all fields with their values and match status
    all_fields = []
    for key, val in record.items():
        if key.startswith("_"):
            continue
        if val is None or str(val).strip() in ("", "None"):
            continue

        label = FIELD_LABELS.get(key, key)
        field_match = next((m for m in matches if m["field"] == key), None)

        all_fields.append({
            "key": key,
            "label": label,
            "value": str(val),
            "isMatch": key in match_fields or (field_match is not None and field_match["strength"] != "none"),
            "matchStrength": field_match["strength"] if field_match else "none",
            "matchReason": field_match["reason"] if field_match else None,
        })

    # Also check the compound diagnostic match
    diag_match = next((m for m in matches if m["field"] == "diagnostic"), None)
    if diag_match and diag_match["strength"] != "none":
        # Mark diagnostic_admission and diagnostic_sortie as matching
        for f in all_fields:
            if f["key"] in ("diagnostic_admission", "diagnostic_sortie"):
                f["isMatch"] = True
                f["matchStrength"] = diag_match["strength"]
                f["matchReason"] = diag_match["reason"]
                f["highlightWords"] = diag_match.get("highlightWords", [])

    return {
        "source_file": record.get("_source_file", ""),
        "similarity_score": case["similarity_score"],
        "matches": matches,
        "fields": all_fields,
        "match_count": sum(1 for m in matches if m["strength"] != "none"),
        "total_match_fields": len(matches),
        "is_deceased": record.get("date_décès") is not None and str(record.get("date_décès", "")).strip() != "",
    }


def get_corpus_stats() -> dict:
    """Get statistics about the loaded corpus."""
    _load_corpus()

    total = len(_corpus)
    deceased_count = sum(
        1 for r in _corpus
        if r.get("date_décès") is not None and str(r.get("date_décès", "")).strip() != ""
    )
    male_count = sum(
        1 for r in _corpus
        if str(r.get("sexe_nouveau_né", "")).lower() == "masculin"
    )

    return {
        "total_reports": total,
        "deceased_count": deceased_count,
        "survival_rate": round((1 - deceased_count / max(total, 1)) * 100, 1),
        "male_count": male_count,
        "female_count": total - male_count,
    }
