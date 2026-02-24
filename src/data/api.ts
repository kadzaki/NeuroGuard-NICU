/**
 * API client for the Neonate Dashboard backend.
 * All patient data comes from the backend — no mock data.
 */

const BASE_URL = '/api';

// ── Dashboard types matching what the LLM generates ──

export interface DashboardRiskScore {
    label: string;
    horizon: string;
    level: 'low' | 'moderate' | 'high';
    probabilityRange: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    delta: string;
    details?: string;
}

export interface DashboardContributingFactor {
    id: string;
    text: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    dataSnippet: string;
    noteExcerpt: string;
    similarCaseSummary: string;
}

export interface DashboardSimilarCase {
    id: string;
    ga: number;
    bw: number;
    mainIssue: string;
    outcomeSummary: string;
    timeToEvent: string;
    similarityScore: number;
    details: string;
}

export interface DashboardClinicalInterpretation {
    summary: string;
    uncertaintyFlags: string[];
}

export interface DashboardVitalDataPoint {
    timestamp: string;
    value: number;
}

export interface DashboardVitalSeries {
    label: string;
    unit: string;
    color: string;
    data: DashboardVitalDataPoint[];
}

export interface DashboardIntervention {
    timestamp: string;
    label: string;
    icon: string;
    type: string;
}

export interface DashboardData {
    name: string;
    mrn: string;
    ga: number;
    bw: number;
    dob: string;
    admissionDate: string;
    currentSupport: string;
    sex: string;
    dayOfLife: number;
    overallRisk: 'low' | 'moderate' | 'high';
    overallTrend: 'increasing' | 'decreasing' | 'stable';
    risks: DashboardRiskScore[];
    contributingFactors: DashboardContributingFactor[];
    vitals: DashboardVitalSeries[];
    interventions: DashboardIntervention[];
    similarCases: DashboardSimilarCase[];
    clinicalInterpretation: DashboardClinicalInterpretation;
}

// ── Structured clinical record ──

export interface PatientRecordData {
    [key: string]: string | number | boolean | null | undefined;
}

// ── RAG similar case types ──

export interface RagFieldMatch {
    field: string;
    label: string;
    queryValue: string;
    candidateValue: string;
    strength: 'high' | 'medium' | 'low' | 'none';
    reason: string;
    highlightWords?: string[];
}

export interface RagCaseField {
    key: string;
    label: string;
    value: string;
    isMatch: boolean;
    matchStrength: 'high' | 'medium' | 'low' | 'none';
    matchReason?: string | null;
    highlightWords?: string[];
}

export interface RagCase {
    source_file: string;
    similarity_score: number;
    matches: RagFieldMatch[];
    fields: RagCaseField[];
    match_count: number;
    total_match_fields: number;
    is_deceased: boolean;
}

// ── Full API response ──

export interface PatientRecordResponse {
    id: string;
    created_at: string;
    raw_report: string;
    record: PatientRecordData;
    dashboard: DashboardData;
    rag_cases?: RagCase[];
}

/**
 * Submit a free-text neonatal report for LLM + RAG parsing.
 */
export async function submitReport(reportText: string): Promise<PatientRecordResponse> {
    const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_text: reportText }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Fetch all stored patient records.
 */
export async function fetchPatients(): Promise<PatientRecordResponse[]> {
    const res = await fetch(`${BASE_URL}/patients`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Fetch a single patient record by ID.
 */
export async function fetchPatientById(id: string): Promise<PatientRecordResponse | null> {
    const res = await fetch(`${BASE_URL}/patients/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Delete a patient record.
 */
export async function deletePatient(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/patients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
