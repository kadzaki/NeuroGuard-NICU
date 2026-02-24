<h1 align="center">🏥 NICU Neonate Risk Dashboard</h1>

<p align="center">
  <strong>AI-powered neonatal risk assessment using MedGemma — built for the MedGemma Impact Challenge</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MedGemma-4B--IT-blue?style=flat-square" alt="MedGemma">
  <img src="https://img.shields.io/badge/EmbeddingGemma-RAG-green?style=flat-square" alt="EmbeddingGemma">
  <img src="https://img.shields.io/badge/React_19-TypeScript-61dafb?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square" alt="FastAPI">
  <img src="https://img.shields.io/badge/llama.cpp-Local_Inference-orange?style=flat-square" alt="llama.cpp">
</p>

---

## 📋 Overview

A real-time clinical decision support dashboard for **Neonatal Intensive Care Units (NICU)** at CHU Oujda, Morocco. The system ingests free-text French medical reports, extracts 70+ structured clinical fields using **MedGemma**, performs risk assessment through **RAG** against a corpus of **1,230 real patient records**, and provides explainable clinical interpretation — all running **100% locally** with no cloud dependencies.

### Key Features

- 🧠 **MedGemma-powered extraction** — Parses unstructured French medical text into 70+ structured clinical fields
- 📊 **Hybrid RAG retrieval** — Field-based matching (60%) + embedding similarity (40%) across 1,230 real NICU cases
- ⚠️ **Risk assessment** — Mortality and complication risk scoring grounded in similar historical cases
- 🔍 **Full case comparison** — Shows complete clinical reports of similar cases organized by medical sections
- 🏥 **Clinical interpretation** — AI-generated analysis explicitly referencing real similar cases
- 🌍 **Bilingual** — Full French / English interface (i18n)
- 🔒 **Privacy-first** — Everything runs locally via llama.cpp, no patient data leaves the hospital

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                      │
│  HomePage → PatientPage → RiskCards / RAG Cases / Timeline   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────┐
│                    Backend (FastAPI)                          │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ LLM Service │  │ RAG Service  │  │    Storage (JSON)  │   │
│  │ (MedGemma)  │  │ Field+Embed  │  │  patients.json     │   │
│  └──────┬──────┘  └──────┬───────┘  └───────────────────┘   │
│         │                │                                    │
└─────────┼────────────────┼────────────────────────────────────┘
          │                │
  ┌───────▼──────┐  ┌──────▼────────┐
  │  MedGemma    │  │ EmbeddingGemma │
  │  (llama.cpp) │  │ (llama.cpp)    │
  │  :8080       │  │ :8081          │
  └──────────────┘  └───────────────┘
```

### Two-Model Safety Architecture

| Component | Model | Purpose |
|-----------|-------|---------|
| **Extraction + Interpretation** | MedGemma 4B IT (French fine-tune) | Parses reports → structured JSON, generates clinical narrative |
| **Risk Scoring** | RAG (field + embedding) | Retrieves similar cases, computes weighted similarity — no LLM black-box risk |

This separation ensures risk scores are **auditable and explainable**: clinicians can inspect exactly which historical cases drove the assessment and why.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **llama.cpp** ([build instructions](https://github.com/ggerganov/llama.cpp))
- **MedGemma GGUF** model (French fine-tune)
- **EmbeddingGemma GGUF** model

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/nicu-neonate-dashboard.git
cd nicu-neonate-dashboard/neonate-dashboard

# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### 2. Download Models

```bash
# MedGemma (French fine-tune, ~3GB for Q5_K_M)
python download.py

# EmbeddingGemma — download a GGUF embedding model
# e.g., from https://huggingface.co
```

### 3. Start LLM Servers

```bash
# Terminal 1: MedGemma (structured extraction + interpretation)
llama-server -m MedGemmaModel/medgemma-4b-it-french-medical-assistant-q5_k_m.gguf --port 8080

# Terminal 2: EmbeddingGemma (semantic similarity for RAG)
llama-server -m <embedding-gemma.gguf> --port 8081 --embedding
```

### 4. Precompute Embeddings (one-time)

```bash
cd backend
python precompute_embeddings.py
# → Generates embeddings.npy (1,224 vectors) for the RAG corpus
```

### 5. Launch the Application

```bash
# Terminal 3: Backend
cd backend
python main.py
# → FastAPI server at http://localhost:8000

# Terminal 4: Frontend
cd neonate-dashboard
npm run dev
# → Vite dev server at http://localhost:5173
```

Open **http://localhost:5173** — submit a French medical report and watch MedGemma analyze it.

---

## 📁 Project Structure

```
neonate-dashboard/
├── src/                          # React 19 + TypeScript frontend
│   ├── components/
│   │   ├── RagSimilarCases.tsx   # Full clinical reports of similar RAG cases
│   │   ├── RiskSummaryCards.tsx  # Risk level cards with trends
│   │   ├── ContributingFactors.tsx
│   │   ├── TrendTimeline.tsx     # Vitals timeline visualization
│   │   ├── ClinicalInterpretation.tsx
│   │   ├── SimilarCases.tsx      # LLM-generated case summaries
│   │   └── NewReportModal.tsx    # Report submission form
│   ├── pages/
│   │   ├── HomePage.tsx          # Unit-wide patient overview
│   │   ├── PatientPage.tsx       # Individual patient risk profile
│   │   └── PatientRecordPage.tsx # Structured record viewer (70+ fields)
│   ├── data/
│   │   ├── api.ts                # Backend API client
│   │   └── types.ts              # TypeScript interfaces
│   ├── i18n.tsx                  # Bilingual translations (EN/FR)
│   └── App.tsx                   # Router setup
│
├── backend/                      # FastAPI + Python backend
│   ├── main.py                   # FastAPI app + CORS
│   ├── routes.py                 # API endpoints (/api/reports, /api/patients, /api/stats)
│   ├── llm_service.py            # MedGemma integration (Gemma chat template)
│   ├── rag_service.py            # Hybrid RAG: field matching + embedding similarity
│   ├── precompute_embeddings.py  # One-time embedding generation script
│   ├── storage.py                # JSON-based patient record persistence
│   ├── models.py                 # Pydantic schemas (70+ clinical fields)
│   ├── .env                      # Server configuration
│   ├── requirements.txt          # Python dependencies (zero OpenAI)
│   └── rag_data/                 # RAG corpus
│       ├── cr_1.json ... cr_1230.json  # 1,230 real patient records
│       ├── embeddings.npy        # Precomputed embedding vectors
│       └── embeddings_index.json # Filename-to-index mapping
```

---

## 🔬 How It Works

### Pipeline: Report → Analysis

```
1. Clinician pastes French medical report
          │
2. Quick regex extraction (weight, GA, sex, CRP, APGAR)
          │
3. RAG retrieval: field matching (60%) + embedding similarity (40%)
   → Top 10 similar cases from 1,230-record corpus
          │
4. MedGemma prompt: system instructions + report + similar cases
   → Gemma chat template: <start_of_turn>user ... <end_of_turn>
          │
5. MedGemma outputs JSON with:
   • "record": 70+ structured clinical fields
   • "dashboard": risk assessment, contributing factors,
     clinical interpretation grounded in real similar cases
          │
6. Frontend renders: risk cards, trend timeline,
   full RAG case reports, clinical interpretation
```

### RAG Similarity Scoring

The hybrid RAG engine combines two complementary approaches:

| Method | Weight | Strengths |
|--------|--------|-----------|
| **Field-based** | 60% | Precise clinical matching (weight ±200g, GA ±2 weeks, same sex, CRP range) |
| **Embedding-based** | 40% | Semantic similarity (catches diagnosis paraphrasing, related conditions) |

Field matching provides **explainability** (highlighted per-field comparisons in the UI), while embeddings improve **recall** for semantically similar but differently worded cases.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, React Router |
| **Backend** | FastAPI, Pydantic, Uvicorn |
| **LLM** | MedGemma 4B IT (French fine-tune, GGUF) |
| **Embeddings** | EmbeddingGemma (GGUF) |
| **Inference** | llama.cpp (local, no cloud) |
| **RAG** | Field-based + cosine similarity (NumPy) |
| **Data** | JSON files (1,230 real NICU records) |
| **i18n** | Custom React Context (EN/FR) |

**Zero external API dependencies.** Everything runs on-premise for maximum patient data privacy.

---

## 🔐 Privacy & Safety

- **100% local inference** — Patient data never leaves the hospital network
- **No cloud APIs** — MedGemma and EmbeddingGemma run via llama.cpp on local hardware
- **Explainable risk scores** — RAG-based, not black-box LLM predictions
- **Clinical decision support** — Assists clinicians, never replaces their judgment
- **Auditable** — Every risk score can be traced back to specific similar cases and matching fields

---

## 📊 RAG Corpus

The system includes a corpus of **1,230 real neonatal patient records** from CHU Oujda NICU:

| Statistic | Value |
|-----------|-------|
| Total records | 1,230 |
| Structured fields per record | 70+ |
| Embedded records | 1,224 |
| Embedding dimensions | 1,536 |
| Survival rate | ~85% |

---

## 🎥 Demo

📹 [Watch the demo video](https://youtu.be/mS3dk6yu6AI)

---

## 🤝 Contributing

Contributions are welcome! Areas of interest:

- Improving MedGemma prompt engineering for French medical text
- Adding new clinical sections to the RAG corpus
- Implementing embedding-based reranking
- Database migration (JSON → PostgreSQL) for production scale
- Additional language support

---

## 📄 License

This project was built for the **MedGemma Impact Challenge** by Google Research.

---

<p align="center">
  Built with ❤️ for neonatal care at <strong>CHU Oujda, Morocco</strong>
</p>
