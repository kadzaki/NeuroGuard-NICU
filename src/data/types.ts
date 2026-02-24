export type RiskLevel = 'low' | 'moderate' | 'high';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type SupportType = 'Room Air' | 'Nasal Cannula' | 'CPAP' | 'BiPAP' | 'HFNC' | 'Mechanical Ventilation' | 'HFOV';

export interface RiskScore {
  label: string;
  horizon: string;          // e.g. "12h", "24h"
  level: RiskLevel;
  probabilityRange: string; // e.g. "35–60%"
  trend: TrendDirection;
  delta: string;            // e.g. "+12% over 6h"
  details?: string;
}

export interface ContributingFactor {
  id: string;
  text: string;
  trend: TrendDirection;
  dataSnippet: string;
  noteExcerpt: string;
  similarCaseSummary: string;
}

export interface VitalDataPoint {
  timestamp: string;  // ISO date string
  value: number;
}

export interface VitalSeries {
  label: string;
  unit: string;
  color: string;
  data: VitalDataPoint[];
}

export interface Intervention {
  timestamp: string;
  label: string;
  icon: string;   // emoji
  type: string;
}

export interface SimilarCase {
  id: string;
  ga: number;
  bw: number;
  mainIssue: string;
  outcomeSummary: string;
  timeToEvent: string;
  similarityScore: number;
  details: string;
}

export interface ClinicalInterpretation {
  summary: string;
  uncertaintyFlags: string[];
}

export interface Patient {
  id: string;
  name: string;
  mrn: string;            // medical record number
  ga: number;             // gestational age in weeks
  bw: number;             // birth weight in grams
  dob: string;
  admissionDate: string;
  currentSupport: SupportType;
  sex: 'M' | 'F';
  dayOfLife: number;
  risks: RiskScore[];
  overallRisk: RiskLevel;
  overallTrend: TrendDirection;
  contributingFactors: ContributingFactor[];
  vitals: VitalSeries[];
  interventions: Intervention[];
  similarCases: SimilarCase[];
  clinicalInterpretation: ClinicalInterpretation;
}
