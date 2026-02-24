"""
LLM service for parsing free-text neonatal reports into structured JSON
AND generating dashboard data (risk assessment, similar cases, interpretation).

Uses MedGemma (via llama.cpp) as the LLM backbone, with RAG context from
a local corpus of 1230 real neonatal patient records.

Architecture:
  - MedGemma: structured extraction + clinical narrative generation
  - RAG service: field-based + embedding-based similarity retrieval
"""

import os
import re
import json
import logging
import requests
from dotenv import load_dotenv
import rag_service

load_dotenv()
logger = logging.getLogger(__name__)

# All structured fields expected in the record output
RECORD_FIELDS = [
    "date_entrée", "date_décès", "date_sortie", "sexe_nouveau_né",
    "date_naissance", "type_mariage", "degré_consanguinité", "ville_origine",
    "ville_actuelle", "couverture_sanitaire", "admis_quel_jour", "âge_mère",
    "nombre_fausses_accouchement", "type_grossesse", "suivi_grossesse",
    "grossesse_mené_à_terme", "dubowitz", "type_accouchement",
    "voie_accouchement", "anamnèse_infectieuse", "groupage_maman",
    "APGAR_naissance", "couleur", "tonicité", "réactivité", "RSD", "RA",
    "hémodynamique_FC", "hémodynamique_TRC", "respiratoire_SS",
    "respiratoire_SaO2", "respiratoire_FR", "glycémie_capillaire", "poids",
    "taille", "périmètre_crânien", "MV", "râles_auscultation",
    "thorax_morphologie", "abdomen", "masse_palpable", "HSMG", "B1B2",
    "souffle_surajouté", "bruits_surajoutés", "Hb", "OGE_sexe", "testicules",
    "bilan_malformatif", "radio_thorax", "MEC", "NFS_hb", "plaquettes",
    "urée", "créat", "ionogramme_Nat", "ionogramme_K_plus", "ionogramme_AÏb",
    "GB", "ETF", "PNN", "CPK", "ECBU", "valeur_ECBU", "lymphopénie", "CRP",
    "contrôlé_âpres", "LDH", "calcémie", "albuminémie", "TP", "décédé",
]

SYSTEM_PROMPT = """Tu es un assistant médical spécialisé en néonatologie dans un service de réanimation néonatale.

Tu reçois un compte rendu médical d'un nouveau-né et des cas similaires provenant d'une base de données réelle de 1230 dossiers patients.

Tu dois produire un JSON avec DEUX sections:

## 1. "record" — Extraction structurée
Extrais les champs cliniques du rapport. Si une info n'est pas mentionnée, mets null.
Champs: """ + json.dumps(RECORD_FIELDS, ensure_ascii=False) + """

## 2. "dashboard" — Analyse clinique pour le tableau de bord
Génère une analyse de risque FONDÉE SUR LES CAS SIMILAIRES fournis:

{
  "name": "Nom du patient ou description (ex: Nouveau-né, Bébé X)",
  "mrn": "Numéro dossier si disponible, sinon générer un ID",
  "ga": nombre (âge gestationnel en semaines, extrait de dubowitz ou du texte),
  "bw": nombre (poids de naissance en grammes),
  "dob": "date de naissance",
  "admissionDate": "date d'admission",
  "currentSupport": "type de support respiratoire actuel",
  "sex": "M" ou "F",
  "dayOfLife": nombre (jour de vie à l'admission),
  "overallRisk": "high" | "moderate" | "low",
  "overallTrend": "increasing" | "decreasing" | "stable",
  "risks": [
    {
      "label": "description du risque",
      "horizon": "12h" ou "24h",
      "level": "high" | "moderate" | "low",
      "probabilityRange": "X–Y%",
      "trend": "increasing" | "decreasing" | "stable",
      "delta": "description du changement"
    }
  ],
  "contributingFactors": [
    {
      "id": "f1",
      "text": "description du facteur",
      "trend": "increasing" | "decreasing" | "stable",
      "dataSnippet": "données pertinentes",
      "noteExcerpt": "extrait du rapport",
      "similarCaseSummary": "résumé basé sur les cas similaires réels fournis"
    }
  ],
  "similarCases": [
    {
      "id": "SC1",
      "ga": nombre,
      "bw": nombre,
      "mainIssue": "problème principal du cas similaire",
      "outcomeSummary": "résumé de l'issue",
      "timeToEvent": "délai avant l'événement",
      "similarityScore": nombre (0-100),
      "details": "description détaillée du cas similaire"
    }
  ],
  "clinicalInterpretation": {
    "summary": "Interprétation clinique globale, OBLIGATOIREMENT fondée sur les cas similaires réels",
    "uncertaintyFlags": ["liste des incertitudes ou données manquantes"]
  },
  "vitals": [],
  "interventions": []
}

RÈGLES CRITIQUES:
1. Retourne UNIQUEMENT du JSON valide, sans texte supplémentaire.
2. Les risques doivent être FONDÉS sur les cas similaires — cite des statistiques réelles (ex: "parmi les 5 cas similaires, 3 ont eu une issue défavorable").
3. Les similarCases dans le dashboard doivent être extraits des CAS SIMILAIRES RÉELS fournis ci-dessous — ne les invente PAS.
4. L'interprétation clinique doit explicitement référencer les cas similaires.
5. Évalue le risque (overallRisk) en te basant sur les issues (décès, complications) des cas similaires.
6. Pour le poids (bw), normalise en grammes (si < 100, multiplie par 1000).
"""


def _llm_complete(prompt: str, max_tokens: int = 4096) -> str:
    """
    Send a prompt to MedGemma via llama.cpp completions endpoint.
    Returns the raw text response.
    """
    base_url = os.getenv("LLM_BASE_URL", "http://localhost:8080")
    url = f"{base_url}/v1/completions"

    payload = {
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": 0.2,
        "stop": ["<end_of_turn>"],
    }

    logger.info(f"Sending request to MedGemma at {url} ({len(prompt)} chars)")

    try:
        resp = requests.post(url, json=payload, timeout=300)
        resp.raise_for_status()
    except requests.ConnectionError:
        raise ConnectionError(
            f"Cannot connect to MedGemma at {base_url}. "
            "Start llama.cpp: llama-server -m <model.gguf> --port 8080"
        )
    except requests.HTTPError as e:
        raise ValueError(f"MedGemma returned HTTP {resp.status_code}: {resp.text[:500]}")

    data = resp.json()
    return data["choices"][0]["text"].strip()


def _extract_json(text: str) -> dict:
    """
    Robustly extract a JSON object from MedGemma's response.
    MedGemma doesn't have a native JSON mode, so it may include
    markdown fences, preamble text, or trailing content.
    """
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON within markdown code fences
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find the outermost { ... } block
    brace_start = text.find("{")
    if brace_start >= 0:
        depth = 0
        for i in range(brace_start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[brace_start:i + 1])
                    except json.JSONDecodeError:
                        break

    logger.error(f"Failed to extract JSON from response: {text[:500]}")
    raise ValueError("MedGemma response did not contain valid JSON")


def _format_similar_cases(similar_cases: list[dict]) -> str:
    """Format retrieved similar cases for inclusion in the LLM prompt."""
    if not similar_cases:
        return "Aucun cas similaire trouvé dans la base de données."

    lines = []
    for i, case in enumerate(similar_cases, 1):
        record = case["record"]
        score = case["similarity_score"]

        # Extract key fields for context
        deceased = "OUI" if (record.get("date_décès") and str(record.get("date_décès", "")).strip()) else "NON"
        weight = record.get("poids", "?")
        sex = record.get("sexe_nouveau_né", "?")
        ga = record.get("dubowitz", "?")
        apgar = record.get("APGAR_naissance", "?")
        diag_adm = record.get("diagnostic_admission", "?")
        diag_sort = record.get("diagnostic_sortie", "?")
        voie = record.get("voie_accouchement", "?")
        crp = record.get("CRP", "?")
        hb = record.get("NFS_hb", "?")
        mec = record.get("MEC", "?")
        date_entree = record.get("date_entrée", "?")
        date_sortie = record.get("date_sortie", "?")
        date_deces = record.get("date_décès", "?")
        age_mere = record.get("âge_mère", "?")
        antecedent = record.get("antécédent_mère", "?")

        lines.append(f"""
--- CAS SIMILAIRE #{i} (score: {score}%) ---
Poids: {weight} | Sexe: {sex} | AG: {ga} | APGAR: {apgar}
Diagnostic admission: {diag_adm}
Diagnostic sortie: {diag_sort}
Voie accouchement: {voie}
Âge mère: {age_mere} | Antécédents: {antecedent}
CRP: {crp} | NFS Hb: {hb}
MEC: {mec}
Dates: entrée={date_entree}, sortie={date_sortie}, décès={date_deces}
DÉCÉDÉ: {deceased}
""")

    return "\n".join(lines)


def parse_report(report_text: str) -> dict:
    """
    Parse a free-text neonatal report using RAG + MedGemma.

    1. Quick regex extraction to get matching fields
    2. RAG: find similar cases (field + embedding similarity)
    3. MedGemma: full analysis with RAG context (Gemma chat template)

    Returns dict with 'record' and 'dashboard' keys.
    """
    # Step 1: Quick field extraction for RAG matching
    quick_fields = _quick_extract(report_text)

    # Step 2: RAG retrieval (field matching + embedding similarity)
    similar_cases = rag_service.find_similar(quick_fields, top_k=10, query_text=report_text)
    similar_context = _format_similar_cases(similar_cases)
    corpus_stats = rag_service.get_corpus_stats()

    logger.info(f"RAG retrieved {len(similar_cases)} similar cases")

    # Step 3: Build prompt with Gemma chat template
    user_content = f"""RAPPORT PATIENT À ANALYSER:
{report_text}

STATISTIQUES DE LA BASE DE DONNÉES (1230 dossiers):
- Total: {corpus_stats['total_reports']} patients
- Taux de survie: {corpus_stats['survival_rate']}%
- Décès: {corpus_stats['deceased_count']}
- Masculin: {corpus_stats['male_count']} | Féminin: {corpus_stats['female_count']}

CAS SIMILAIRES RÉELS RETROUVÉS (top {len(similar_cases)}):
{similar_context}

Produis le JSON avec "record" et "dashboard" comme décrit dans les instructions."""

    # Gemma chat template: system + user in one turn, then model turn
    prompt = f"""<start_of_turn>user
{SYSTEM_PROMPT}

{user_content}<end_of_turn>
<start_of_turn>model
"""

    logger.info(f"Sending report to MedGemma with RAG context ({len(prompt)} chars)")

    raw_response = _llm_complete(prompt, max_tokens=4096)
    logger.info(f"MedGemma response received ({len(raw_response)} chars)")

    parsed = _extract_json(raw_response)

    # Ensure both sections exist
    result = {
        "record": parsed.get("record", {}),
        "dashboard": parsed.get("dashboard", {}),
    }

    return result


def _quick_extract(text: str) -> dict:
    """
    Quick regex-based extraction of key fields from free text
    for RAG matching (avoids a separate LLM call).
    """
    import re

    fields: dict = {}

    # Weight
    weight_match = re.search(r"poids[:\s]*(\d+[.,]?\d*)\s*(g|kg|grammes)?", text, re.IGNORECASE)
    if weight_match:
        fields["poids"] = weight_match.group(1).replace(",", ".")

    # Sex
    if re.search(r"sexe\s*(masculin|mâle|garçon)", text, re.IGNORECASE):
        fields["sexe_nouveau_né"] = "Masculin"
    elif re.search(r"sexe\s*(féminin|femelle|fille)", text, re.IGNORECASE):
        fields["sexe_nouveau_né"] = "Féminin"
    elif "masculin" in text.lower():
        fields["sexe_nouveau_né"] = "Masculin"
    elif "féminin" in text.lower():
        fields["sexe_nouveau_né"] = "Féminin"

    # Gestational age
    ga_match = re.search(r"(\d{2})\s*(?:SA|semaines?\s*d['\s]aménorrhée)", text, re.IGNORECASE)
    if ga_match:
        fields["dubowitz"] = ga_match.group(1) + "SA"

    # Delivery route
    if re.search(r"voie\s*haute|césarienne", text, re.IGNORECASE):
        fields["voie_accouchement"] = "Voie haute"
    elif re.search(r"voie\s*basse", text, re.IGNORECASE):
        fields["voie_accouchement"] = "Voie basse"

    # Marriage type
    if re.search(r"non\s*consanguin", text, re.IGNORECASE):
        fields["type_mariage"] = "Non consanguin"
    elif re.search(r"consanguin", text, re.IGNORECASE):
        fields["type_mariage"] = "Consanguin"

    # CRP
    crp_match = re.search(r"CRP[:\s]*(\d+[.,]?\d*)", text, re.IGNORECASE)
    if crp_match:
        fields["CRP"] = float(crp_match.group(1).replace(",", "."))

    # APGAR
    apgar_match = re.search(r"APGAR[:\s]*(\d+/\d+)", text, re.IGNORECASE)
    if apgar_match:
        fields["APGAR_naissance"] = apgar_match.group(1)

    return fields
