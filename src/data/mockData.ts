import type { Patient } from './types';

function generateVitals(days: number, baseHR: number, baseSpo2: number, baseTemp: number, baseCRP: number, baseWBC: number) {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const hr: { timestamp: string; value: number }[] = [];
    const spo2: { timestamp: string; value: number }[] = [];
    const temp: { timestamp: string; value: number }[] = [];
    const crp: { timestamp: string; value: number }[] = [];
    const wbc: { timestamp: string; value: number }[] = [];

    for (let i = 0; i < days * 6; i++) {
        const t = new Date(start.getTime() + i * 4 * 60 * 60 * 1000).toISOString();
        hr.push({ timestamp: t, value: baseHR + Math.round((Math.random() - 0.5) * 20) });
        spo2.push({ timestamp: t, value: Math.min(100, baseSpo2 + Math.round((Math.random() - 0.5) * 6)) });
        temp.push({ timestamp: t, value: +(baseTemp + (Math.random() - 0.5) * 0.8).toFixed(1) });
        crp.push({ timestamp: t, value: +(baseCRP + Math.random() * baseCRP * 0.5 + i * 0.1).toFixed(1) });
        wbc.push({ timestamp: t, value: +(baseWBC + (Math.random() - 0.5) * 4).toFixed(1) });
    }

    return [
        { label: 'Heart Rate', unit: 'bpm', color: '#f87171', data: hr },
        { label: 'SpO₂', unit: '%', color: '#60a5fa', data: spo2 },
        { label: 'Temperature', unit: '°C', color: '#fbbf24', data: temp },
        { label: 'CRP', unit: 'mg/L', color: '#f472b6', data: crp },
        { label: 'WBC', unit: 'K/μL', color: '#a78bfa', data: wbc },
    ];
}

export const patients: Patient[] = [
    {
        id: 'P001',
        name: 'Baby Martinez',
        mrn: 'MRN-20260187',
        ga: 29,
        bw: 1120,
        dob: '2026-02-14',
        admissionDate: '2026-02-14',
        currentSupport: 'CPAP',
        sex: 'M',
        dayOfLife: 7,
        overallRisk: 'high',
        overallTrend: 'increasing',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'high', probabilityRange: '35–60%', trend: 'increasing', delta: '+12% over 6h' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'moderate', probabilityRange: '15–30%', trend: 'stable', delta: 'No change' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'low', probabilityRange: '<10%', trend: 'decreasing', delta: '-5% over 6h' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Increasing apnea mentions (3 in last 6h)', trend: 'increasing', dataSnippet: 'Apnea events: 1 (0-6h ago), 2 (6-12h ago), 0 (12-18h ago)', noteExcerpt: '"Infant had 3 apneic episodes requiring stimulation, longest lasting 22 seconds"', similarCaseSummary: '5 of 8 similar cases with this pattern required escalation within 12h' },
            { id: 'f2', text: 'CRP rising trend', trend: 'increasing', dataSnippet: 'CRP: 8.2 → 14.5 → 22.1 mg/L over 18h', noteExcerpt: '"Labs show uptrending inflammatory markers, blood culture sent"', similarCaseSummary: 'Rising CRP in premature neonates correlated with confirmed sepsis in 40% of retrieved cases' },
            { id: 'f3', text: 'Feeding intolerance reported', trend: 'stable', dataSnippet: 'Residual volumes: 4ml, 6ml, 5ml (last 3 feeds)', noteExcerpt: '"Gastric residuals noted, feeds held per protocol"', similarCaseSummary: 'Feeding intolerance in combination with rising CRP was present in 6 of 8 escalated cases' },
            { id: 'f4', text: 'GA 29 weeks (prematurity risk)', trend: 'stable', dataSnippet: 'Gestational age: 29+2 weeks', noteExcerpt: '"Premature infant, appropriate for gestational age"', similarCaseSummary: 'Baseline elevated risk due to extreme prematurity' },
            { id: 'f5', text: 'Similar pattern seen in 8 retrieved cases → 5 required escalation', trend: 'increasing', dataSnippet: 'Pattern match score: 0.87', noteExcerpt: '', similarCaseSummary: '5/8 cases with apnea + rising CRP + feeding intolerance in <30wk GA required respiratory escalation or antibiotic change within 12h' },
        ],
        vitals: generateVitals(7, 155, 93, 37.1, 8, 12),
        interventions: [
            { timestamp: '2026-02-14T06:00:00Z', label: 'CPAP Started', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-15T14:00:00Z', label: 'Caffeine Citrate', icon: '💊', type: 'medication' },
            { timestamp: '2026-02-17T08:00:00Z', label: 'Ampicillin + Gentamicin', icon: '💉', type: 'antibiotics' },
            { timestamp: '2026-02-19T10:00:00Z', label: 'Phototherapy', icon: '☀️', type: 'phototherapy' },
        ],
        similarCases: [
            { id: 'SC1', ga: 28, bw: 1050, mainIssue: 'Late-onset sepsis with respiratory deterioration', outcomeSummary: 'Intubated on Day 8, recovered after 5-day antibiotic course', timeToEvent: 'Intubated 8h after similar pattern', similarityScore: 92, details: 'Male infant, 28+4 GA, presented with increasing apnea and CRP rise on DOL 7. Blood culture positive for CoNS. Required mechanical ventilation for 72h before successful extubation to CPAP.' },
            { id: 'SC2', ga: 30, bw: 1280, mainIssue: 'Apnea of prematurity with feeding intolerance', outcomeSummary: 'Managed with caffeine adjustment, no escalation needed', timeToEvent: 'Resolved within 12h', similarityScore: 85, details: 'Female infant, 30+1 GA, had cluster of apnea events with mild CRP elevation. Caffeine dose increased, feeds adjusted. Resolved without respiratory escalation.' },
            { id: 'SC3', ga: 27, bw: 920, mainIssue: 'NEC concern with sepsis workup', outcomeSummary: 'NPO + antibiotics, surgical consult, medical management successful', timeToEvent: 'Antibiotics started 4h after pattern recognition', similarityScore: 78, details: 'Male infant, 27+0 GA, feeding intolerance with abdominal distension and rising CRP. Abdominal X-ray showed pneumatosis. Managed medically with 14-day antibiotic course.' },
            { id: 'SC4', ga: 29, bw: 1150, mainIssue: 'Respiratory deterioration requiring HFOV', outcomeSummary: 'Escalated to HFOV on Day 6, weaned back to CPAP by Day 10', timeToEvent: 'HFOV started 6h after initial decline', similarityScore: 74, details: 'Female infant, 29+3 GA, progressive respiratory failure with increasing FiO2 requirements. Transitioned from CPAP to HFOV. Surfactant administered. Gradual improvement.' },
            { id: 'SC5', ga: 31, bw: 1400, mainIssue: 'Culture-negative sepsis', outcomeSummary: 'Completed 7-day empiric antibiotics, full recovery', timeToEvent: 'Treatment started 2h after flag', similarityScore: 70, details: 'Male infant, 31+0 GA, CRP elevation with temperature instability. Blood cultures remained negative. Treated empirically with clinical improvement noted within 48h.' },
        ],
        clinicalInterpretation: {
            summary: 'The patient demonstrates increasing apnea frequency and rising inflammatory markers in the context of prematurity (29 GA). Among 12 similar cases retrieved, 6 required respiratory escalation within 12 hours. Risk trend has increased compared to previous 6 hours. The combination of apnea clustering, CRP trajectory, and feeding intolerance suggests close monitoring for evolving sepsis or NEC is warranted.',
            uncertaintyFlags: ['Blood culture pending (sent 6h ago)', 'No recent blood gas (last ABG >8h ago)', 'Missing bilirubin in last 24h'],
        },
    },
    {
        id: 'P002', name: 'Baby Chen', mrn: 'MRN-20260192', ga: 26, bw: 820, dob: '2026-02-10', admissionDate: '2026-02-10', currentSupport: 'Mechanical Ventilation', sex: 'F', dayOfLife: 11,
        overallRisk: 'high', overallTrend: 'stable',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'high', probabilityRange: '40–65%', trend: 'stable', delta: 'No significant change' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'high', probabilityRange: '30–50%', trend: 'increasing', delta: '+8% over 6h' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'moderate', probabilityRange: '15–25%', trend: 'stable', delta: 'No change' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Persistent ventilator dependence (DOL 11)', trend: 'stable', dataSnippet: 'FiO2: 0.45, PEEP: 6, Rate: 30', noteExcerpt: '"Remains on mechanical ventilation, unable to wean"', similarCaseSummary: 'Prolonged ventilation at <27wk GA associated with increased infection risk' },
            { id: 'f2', text: 'Temperature instability (2 episodes in 8h)', trend: 'increasing', dataSnippet: 'Temp: 36.2°C, 37.8°C, 36.4°C', noteExcerpt: '"Temperature lability noted, sepsis workup initiated"', similarCaseSummary: 'Temperature instability in ventilated micro-preemies preceded confirmed sepsis in 55% of cases' },
            { id: 'f3', text: 'Central line in situ >7 days', trend: 'stable', dataSnippet: 'UVC placed DOL 1, still in use', noteExcerpt: '"UVC line day 11, consider PICC placement"', similarCaseSummary: 'Central line duration >7d is independent risk factor for CLABSI' },
        ],
        vitals: generateVitals(11, 162, 91, 36.8, 15, 14),
        interventions: [
            { timestamp: '2026-02-10T02:00:00Z', label: 'Intubation + Surfactant', icon: '🫁', type: 'respiratory' },
            { timestamp: '2026-02-11T06:00:00Z', label: 'UVC Placed', icon: '🩸', type: 'line' },
            { timestamp: '2026-02-14T10:00:00Z', label: 'Vancomycin Started', icon: '💉', type: 'antibiotics' },
            { timestamp: '2026-02-18T08:00:00Z', label: 'TPN Adjusted', icon: '🧪', type: 'nutrition' },
        ],
        similarCases: [
            { id: 'SC1', ga: 25, bw: 780, mainIssue: 'CLABSI with CoNS', outcomeSummary: 'Line removed, 14-day vancomycin course', timeToEvent: 'Blood culture positive 18h after flag', similarityScore: 88, details: 'Micro-preemie with prolonged UVC, developed CLABSI. Required line removal and extended antibiotics.' },
            { id: 'SC2', ga: 27, bw: 900, mainIssue: 'Ventilator-associated pneumonia', outcomeSummary: 'Antibiotic change, extubated Day 14', timeToEvent: 'Diagnosed 12h after deterioration', similarityScore: 82, details: 'Ventilated infant with increasing secretions and CRP rise. Tracheal aspirate culture positive.' },
            { id: 'SC3', ga: 26, bw: 850, mainIssue: 'BPD progression', outcomeSummary: 'Transitioned to HFOV, then slow wean', timeToEvent: 'HFOV started Day 12', similarityScore: 76, details: 'Chronic lung changes on X-ray, required HFOV transition with dexamethasone course.' },
            { id: 'SC4', ga: 28, bw: 980, mainIssue: 'Late-onset sepsis', outcomeSummary: 'Treated successfully, discharged Day 45', timeToEvent: 'Sepsis confirmed 24h after initial flag', similarityScore: 72, details: 'Temperature instability followed by positive blood culture for E. coli.' },
            { id: 'SC5', ga: 26, bw: 800, mainIssue: 'IVH Grade II', outcomeSummary: 'Conservative management, stable', timeToEvent: 'Diagnosed on routine scan Day 7', similarityScore: 65, details: 'Incidental finding on routine cranial ultrasound, managed conservatively.' },
        ],
        clinicalInterpretation: {
            summary: 'This extremely premature infant (26 GA) remains ventilator-dependent on DOL 11 with emerging signs of possible infection including temperature instability and prolonged central line duration. The combination of these factors in retrieved similar cases was associated with confirmed bloodstream infection in over 50% of instances. Close surveillance of culture results and consideration for line change is advised.',
            uncertaintyFlags: ['Blood culture pending (sent 4h ago)', 'Tracheal aspirate culture pending', 'No recent cranial ultrasound (last >5 days ago)'],
        },
    },
    {
        id: 'P003', name: 'Baby Thompson', mrn: 'MRN-20260195', ga: 34, bw: 2100, dob: '2026-02-18', admissionDate: '2026-02-18', currentSupport: 'Nasal Cannula', sex: 'M', dayOfLife: 3,
        overallRisk: 'moderate', overallTrend: 'stable',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'moderate', probabilityRange: '10–20%', trend: 'stable', delta: 'No change' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'low', probabilityRange: '<10%', trend: 'stable', delta: 'No change' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'moderate', probabilityRange: '12–22%', trend: 'increasing', delta: '+5% over 6h' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Increasing FiO2 requirement (0.25 → 0.30)', trend: 'increasing', dataSnippet: 'FiO2: 0.21 → 0.25 → 0.30 over 12h', noteExcerpt: '"Weaning oxygen slow, FiO2 increased to maintain SpO2 >92%"', similarCaseSummary: 'Gradual FiO2 increase in late preterms often indicates TTN vs RDS evolution' },
            { id: 'f2', text: 'Mild tachypnea (RR 62-68)', trend: 'stable', dataSnippet: 'RR: 64, 62, 68, 65 (last 4 assessments)', noteExcerpt: '"Tachypneic but comfortable, mild retractions"', similarCaseSummary: 'Persistent tachypnea >60 beyond 48h in late preterms warranted CPAP in 30% of cases' },
        ],
        vitals: generateVitals(3, 148, 95, 36.9, 3, 10),
        interventions: [
            { timestamp: '2026-02-18T08:00:00Z', label: 'Nasal Cannula Started', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-19T14:00:00Z', label: 'First Feed (EBM)', icon: '🍼', type: 'nutrition' },
        ],
        similarCases: [
            { id: 'SC1', ga: 34, bw: 2050, mainIssue: 'TTN with prolonged O2 need', outcomeSummary: 'Resolved by DOL 5, room air', timeToEvent: 'No escalation needed', similarityScore: 90, details: 'Late preterm with TTN, required NC for 4 days then self-resolved.' },
            { id: 'SC2', ga: 33, bw: 1900, mainIssue: 'Late RDS requiring CPAP', outcomeSummary: 'CPAP for 48h then weaned', timeToEvent: 'CPAP started DOL 3', similarityScore: 82, details: 'Initially stable on NC but required CPAP escalation due to increasing work of breathing.' },
            { id: 'SC3', ga: 35, bw: 2300, mainIssue: 'Pneumonia', outcomeSummary: 'Antibiotics + NC, discharged DOL 10', timeToEvent: 'Diagnosed DOL 4', similarityScore: 68, details: 'Worsening respiratory status led to chest X-ray showing infiltrates.' },
            { id: 'SC4', ga: 34, bw: 2150, mainIssue: 'TTN resolved quickly', outcomeSummary: 'Room air by DOL 2', timeToEvent: 'No escalation', similarityScore: 65, details: 'Straightforward TTN with rapid resolution.' },
            { id: 'SC5', ga: 33, bw: 1850, mainIssue: 'Feeding difficulty', outcomeSummary: 'Gavage feeds then transitioned to breast', timeToEvent: 'Full feeds DOL 7', similarityScore: 58, details: 'Poor suck-swallow coordination requiring temporary gavage feeding.' },
        ],
        clinicalInterpretation: {
            summary: 'Late preterm infant (34 GA) on DOL 3 with gradually increasing oxygen requirements and persistent tachypnea. The pattern is most consistent with evolving transient tachypnea or mild RDS. Among similar late preterm cases, approximately 30% required escalation to CPAP. Current trajectory suggests monitoring over the next 6–12h is reasonable.',
            uncertaintyFlags: ['No chest X-ray performed yet', 'Blood gas not obtained'],
        },
    },
    {
        id: 'P004', name: 'Baby Williams', mrn: 'MRN-20260198', ga: 32, bw: 1650, dob: '2026-02-12', admissionDate: '2026-02-12', currentSupport: 'CPAP', sex: 'F', dayOfLife: 9,
        overallRisk: 'moderate', overallTrend: 'decreasing',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'low', probabilityRange: '<10%', trend: 'decreasing', delta: '-8% over 6h' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'moderate', probabilityRange: '10–20%', trend: 'decreasing', delta: '-5% over 12h' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'moderate', probabilityRange: '10–18%', trend: 'stable', delta: 'No change' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Recent antibiotic course (completing Day 7)', trend: 'decreasing', dataSnippet: 'Ampicillin + Gentamicin started DOL 2', noteExcerpt: '"Completing 7-day antibiotic course, CRP trending down"', similarCaseSummary: 'Patients completing antibiotics with normalizing CRP had <15% relapse rate' },
            { id: 'f2', text: 'CPAP weaning attempts ongoing', trend: 'stable', dataSnippet: 'CPAP 5 cmH2O, FiO2 0.25', noteExcerpt: '"Trial of NC planned for tomorrow if stable"', similarCaseSummary: 'Successful CPAP wean at 32wk on DOL 9 achieved in 70% of cases' },
        ],
        vitals: generateVitals(9, 145, 95, 36.8, 12, 11),
        interventions: [
            { timestamp: '2026-02-12T04:00:00Z', label: 'CPAP Started', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-14T10:00:00Z', label: 'Ampicillin + Gentamicin', icon: '💉', type: 'antibiotics' },
            { timestamp: '2026-02-16T08:00:00Z', label: 'Full Enteral Feeds', icon: '🍼', type: 'nutrition' },
        ],
        similarCases: [
            { id: 'SC1', ga: 32, bw: 1600, mainIssue: 'RDS with culture-negative sepsis', outcomeSummary: 'Weaned to room air DOL 12', timeToEvent: 'No re-escalation', similarityScore: 91, details: 'Similar trajectory, successful wean after antibiotic completion.' },
            { id: 'SC2', ga: 31, bw: 1500, mainIssue: 'RDS requiring prolonged CPAP', outcomeSummary: 'CPAP for 14 days then NC', timeToEvent: 'Prolonged wean', similarityScore: 78, details: 'Slower than expected respiratory wean but ultimately successful.' },
            { id: 'SC3', ga: 33, bw: 1750, mainIssue: 'Brief sepsis scare', outcomeSummary: 'Cultures negative, rapid recovery', timeToEvent: 'Resolved in 48h', similarityScore: 75, details: 'Empiric antibiotics with rapid clinical improvement.' },
            { id: 'SC4', ga: 32, bw: 1580, mainIssue: 'Apnea of prematurity', outcomeSummary: 'Caffeine effective, discharged DOL 30', timeToEvent: 'Apnea resolved DOL 14', similarityScore: 70, details: 'Required caffeine but no respiratory escalation.' },
            { id: 'SC5', ga: 31, bw: 1450, mainIssue: 'Feeding intolerance', outcomeSummary: 'Slow advance, full feeds DOL 14', timeToEvent: 'Feeds established', similarityScore: 62, details: 'Required slow feed advancement due to GI intolerance.' },
        ],
        clinicalInterpretation: {
            summary: 'This 32-week infant is on an improving trajectory. Completing a 7-day antibiotic course with normalizing inflammatory markers. CPAP weaning is being considered. Among similar patients at this stage, the majority (>70%) successfully weaned without re-escalation. Continue current management with planned NC trial.',
            uncertaintyFlags: ['Final CRP pending', 'Gentamicin trough level not checked today'],
        },
    },
    {
        id: 'P005', name: 'Baby Okafor', mrn: 'MRN-20260201', ga: 27, bw: 950, dob: '2026-02-06', admissionDate: '2026-02-06', currentSupport: 'HFOV', sex: 'M', dayOfLife: 15,
        overallRisk: 'high', overallTrend: 'increasing',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'high', probabilityRange: '50–70%', trend: 'increasing', delta: '+18% over 6h' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'high', probabilityRange: '35–55%', trend: 'increasing', delta: '+10% over 12h' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'high', probabilityRange: '40–60%', trend: 'increasing', delta: '+15% over 6h' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Acute desaturation episodes (4 in last 4h)', trend: 'increasing', dataSnippet: 'SpO2 drops to 78%, 72%, 80%, 75%', noteExcerpt: '"Multiple desaturation episodes requiring increased FiO2 and manual ventilation"', similarCaseSummary: 'Frequent desaturations in HFOV patients preceded cardiac arrest in 15% of cases' },
            { id: 'f2', text: 'Hemodynamic instability (BP dropping)', trend: 'increasing', dataSnippet: 'MAP: 28 → 24 → 22 mmHg over 6h', noteExcerpt: '"Hypotension noted, dopamine infusion started"', similarCaseSummary: 'Falling MAP in micro-preemies on HFOV associated with IVH extension' },
            { id: 'f3', text: 'Worsening chest X-ray findings', trend: 'increasing', dataSnippet: 'CXR: bilateral opacification increasing', noteExcerpt: '"CXR shows worsening bilateral haziness, air bronchograms"', similarCaseSummary: 'Progressive CXR changes on HFOV suggest surfactant deficiency or evolving BPD' },
        ],
        vitals: generateVitals(15, 170, 88, 37.2, 25, 16),
        interventions: [
            { timestamp: '2026-02-06T01:00:00Z', label: 'Intubation + Surfactant ×2', icon: '🫁', type: 'respiratory' },
            { timestamp: '2026-02-08T06:00:00Z', label: 'HFOV Transition', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-12T10:00:00Z', label: 'Dexamethasone Started', icon: '💊', type: 'medication' },
            { timestamp: '2026-02-19T14:00:00Z', label: 'Dopamine Infusion', icon: '💉', type: 'medication' },
            { timestamp: '2026-02-20T08:00:00Z', label: 'Packed RBC Transfusion', icon: '🩸', type: 'transfusion' },
        ],
        similarCases: [
            { id: 'SC1', ga: 26, bw: 880, mainIssue: 'Severe BPD with pulmonary hypertension', outcomeSummary: 'iNO started, prolonged NICU stay (120 days)', timeToEvent: 'iNO within 6h of similar pattern', similarityScore: 90, details: 'Required iNO for pulmonary hypertension, eventually tracheostomy.' },
            { id: 'SC2', ga: 27, bw: 920, mainIssue: 'Tension pneumothorax', outcomeSummary: 'Chest tube placed emergently', timeToEvent: 'Pneumothorax 4h after desaturation cluster', similarityScore: 85, details: 'Sudden deterioration on HFOV, diagnosed via transillumination.' },
            { id: 'SC3', ga: 28, bw: 1000, mainIssue: 'Septic shock', outcomeSummary: 'Volume resuscitation + pressors, survived', timeToEvent: 'Shock developed 8h after initial signs', similarityScore: 80, details: 'Gram-negative sepsis with hemodynamic collapse, required multiple pressors.' },
            { id: 'SC4', ga: 26, bw: 850, mainIssue: 'IVH Grade III with PHH', outcomeSummary: 'VP shunt placed', timeToEvent: 'IVH diagnosed 12h after instability', similarityScore: 72, details: 'Hemodynamic instability preceded IVH diagnosis on ultrasound.' },
            { id: 'SC5', ga: 27, bw: 940, mainIssue: 'PDA with hemodynamic significance', outcomeSummary: 'Ibuprofen then surgical ligation', timeToEvent: 'Echo done 6h after flagging', similarityScore: 68, details: 'Large PDA contributing to respiratory failure, required surgical ligation.' },
        ],
        clinicalInterpretation: {
            summary: 'This 27-week infant on HFOV (DOL 15) is showing acute deterioration with frequent desaturations, falling blood pressure, and worsening radiographic findings. This pattern is highly concerning for evolving septic shock, pneumothorax, or severe BPD exacerbation. Among similar critically ill micro-preemies, 15% experienced cardiac arrest within 12h of this pattern. Immediate bedside assessment, point-of-care ultrasound, and consideration for additional surfactant or iNO is strongly recommended.',
            uncertaintyFlags: ['No echocardiogram in last 48h', 'Blood gas pending', 'Cranial ultrasound overdue (last >7 days)'],
        },
    },
    {
        id: 'P006', name: 'Baby Johansson', mrn: 'MRN-20260204', ga: 36, bw: 2650, dob: '2026-02-19', admissionDate: '2026-02-19', currentSupport: 'Room Air', sex: 'F', dayOfLife: 2,
        overallRisk: 'low', overallTrend: 'stable',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'low', probabilityRange: '<5%', trend: 'stable', delta: 'No change' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'low', probabilityRange: '<5%', trend: 'stable', delta: 'No change' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'low', probabilityRange: '<5%', trend: 'stable', delta: 'No change' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Hyperbilirubinemia requiring monitoring', trend: 'stable', dataSnippet: 'Bilirubin: 10.2 mg/dL (DOL 2)', noteExcerpt: '"Jaundice noted, bilirubin approaching phototherapy threshold"', similarCaseSummary: 'Most near-term infants with this bilirubin level at DOL 2 do not require phototherapy' },
        ],
        vitals: generateVitals(2, 138, 98, 36.7, 1, 9),
        interventions: [
            { timestamp: '2026-02-19T12:00:00Z', label: 'Breastfeeding Initiated', icon: '🍼', type: 'nutrition' },
        ],
        similarCases: [
            { id: 'SC1', ga: 36, bw: 2700, mainIssue: 'Physiologic jaundice', outcomeSummary: 'Resolved without phototherapy', timeToEvent: 'Peaked DOL 4, resolved DOL 7', similarityScore: 95, details: 'Straightforward jaundice course in a near-term infant.' },
            { id: 'SC2', ga: 37, bw: 2800, mainIssue: 'Jaundice requiring phototherapy', outcomeSummary: 'Brief phototherapy, discharged DOL 5', timeToEvent: 'Phototherapy started DOL 3', similarityScore: 80, details: 'Bilirubin exceeded threshold, 24h of phototherapy sufficient.' },
            { id: 'SC3', ga: 35, bw: 2400, mainIssue: 'Feeding difficulty + jaundice', outcomeSummary: 'Supplemental feeds, resolved', timeToEvent: 'Feeds improved DOL 4', similarityScore: 72, details: 'Poor initial feeding contributing to higher bilirubin levels.' },
            { id: 'SC4', ga: 36, bw: 2550, mainIssue: 'ABO incompatibility jaundice', outcomeSummary: 'Phototherapy ×2 sessions', timeToEvent: 'Second session DOL 4', similarityScore: 65, details: 'Coombs-positive jaundice requiring extended phototherapy.' },
            { id: 'SC5', ga: 37, bw: 2900, mainIssue: 'Observation only', outcomeSummary: 'Discharged DOL 3', timeToEvent: 'No intervention', similarityScore: 60, details: 'Admitted for observation, no issues identified.' },
        ],
        clinicalInterpretation: {
            summary: 'Near-term infant (36 GA) admitted for monitoring on DOL 2. Currently stable on room air with developing jaundice that is being monitored. Risk profile is low across all categories. Continue routine monitoring with bilirubin checks per protocol.',
            uncertaintyFlags: ['Repeat bilirubin due in 6h'],
        },
    },
    {
        id: 'P007', name: 'Baby Petrov', mrn: 'MRN-20260207', ga: 30, bw: 1350, dob: '2026-02-15', admissionDate: '2026-02-15', currentSupport: 'HFNC', sex: 'M', dayOfLife: 6,
        overallRisk: 'moderate', overallTrend: 'increasing',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'moderate', probabilityRange: '15–28%', trend: 'increasing', delta: '+7% over 6h' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'moderate', probabilityRange: '12–22%', trend: 'increasing', delta: '+6% over 12h' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'low', probabilityRange: '<10%', trend: 'stable', delta: 'No change' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'New-onset lethargy reported', trend: 'increasing', dataSnippet: 'Activity score: decreased from baseline', noteExcerpt: '"Infant less active, decreased tone noted on assessment"', similarCaseSummary: 'New lethargy in premature neonates was early sign of infection in 45% of retrieved cases' },
            { id: 'f2', text: 'Glucose instability (2 hypoglycemic episodes)', trend: 'increasing', dataSnippet: 'Glucose: 42, 38, 55, 48 mg/dL', noteExcerpt: '"Two hypoglycemic episodes, glucose bolus given, GIR increased"', similarCaseSummary: 'Glucose instability + lethargy pattern preceded sepsis diagnosis in 35% of cases' },
        ],
        vitals: generateVitals(6, 152, 94, 36.6, 6, 11),
        interventions: [
            { timestamp: '2026-02-15T06:00:00Z', label: 'CPAP Started', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-17T14:00:00Z', label: 'Switched to HFNC', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-20T08:00:00Z', label: 'Glucose Bolus', icon: '💊', type: 'medication' },
        ],
        similarCases: [
            { id: 'SC1', ga: 30, bw: 1300, mainIssue: 'Late-onset sepsis presenting with lethargy', outcomeSummary: 'Confirmed GBS, treated 14 days', timeToEvent: 'Culture positive 24h after lethargy onset', similarityScore: 87, details: 'Presented with subtle lethargy and glucose instability before culture confirmation.' },
            { id: 'SC2', ga: 29, bw: 1200, mainIssue: 'Metabolic disorder workup', outcomeSummary: 'Normal metabolic screen, transient', timeToEvent: 'Resolved in 48h', similarityScore: 75, details: 'Glucose instability triggered metabolic workup, all normal.' },
            { id: 'SC3', ga: 31, bw: 1400, mainIssue: 'NEC Stage I', outcomeSummary: 'NPO + antibiotics, resolved', timeToEvent: 'Diagnosed DOL 7', similarityScore: 70, details: 'Lethargy and feeding changes preceded NEC diagnosis.' },
            { id: 'SC4', ga: 30, bw: 1380, mainIssue: 'Apnea of prematurity', outcomeSummary: 'Caffeine started, improved', timeToEvent: 'Treatment DOL 5', similarityScore: 65, details: 'Lethargy was early manifestation of apnea spells.' },
            { id: 'SC5', ga: 29, bw: 1250, mainIssue: 'IVH Grade I', outcomeSummary: 'Conservative, stable', timeToEvent: 'Found on routine scan', similarityScore: 58, details: 'Incidental finding, no clinical correlation with symptoms.' },
        ],
        clinicalInterpretation: {
            summary: 'This 30-week infant on HFNC (DOL 6) is developing new-onset lethargy with glucose instability. This subtle clinical change pattern is frequently an early harbinger of infection in premature neonates. Among similar cases, 45% had confirmed sepsis. Recommend blood culture, CBC with differential, and close neurological monitoring.',
            uncertaintyFlags: ['No blood culture sent yet', 'Lumbar puncture not performed', 'Metabolic screen results pending'],
        },
    },
    {
        id: 'P008', name: 'Baby Nguyen', mrn: 'MRN-20260210', ga: 33, bw: 1850, dob: '2026-02-16', admissionDate: '2026-02-16', currentSupport: 'Room Air', sex: 'F', dayOfLife: 5,
        overallRisk: 'low', overallTrend: 'decreasing',
        risks: [
            { label: '12h Clinical Deterioration', horizon: '12h', level: 'low', probabilityRange: '<5%', trend: 'decreasing', delta: '-3% over 6h' },
            { label: '24h Sepsis Suspicion', horizon: '24h', level: 'low', probabilityRange: '<5%', trend: 'stable', delta: 'No change' },
            { label: '12h Respiratory Escalation', horizon: '12h', level: 'low', probabilityRange: '<5%', trend: 'decreasing', delta: '-2% over 6h' },
        ],
        contributingFactors: [
            { id: 'f1', text: 'Approaching discharge criteria', trend: 'decreasing', dataSnippet: 'Stable vitals ×48h, full feeds, weight gain', noteExcerpt: '"Meeting discharge milestones, car seat test planned"', similarCaseSummary: 'Patients meeting these criteria discharged within 48–72h in 90% of cases' },
        ],
        vitals: generateVitals(5, 140, 97, 36.7, 2, 9),
        interventions: [
            { timestamp: '2026-02-16T08:00:00Z', label: 'NC Started', icon: '💨', type: 'respiratory' },
            { timestamp: '2026-02-18T10:00:00Z', label: 'Weaned to Room Air', icon: '🌬️', type: 'respiratory' },
            { timestamp: '2026-02-19T06:00:00Z', label: 'Full Oral Feeds', icon: '🍼', type: 'nutrition' },
        ],
        similarCases: [
            { id: 'SC1', ga: 33, bw: 1800, mainIssue: 'Feeder-grower', outcomeSummary: 'Discharged DOL 7', timeToEvent: 'No complications', similarityScore: 95, details: 'Straightforward NICU course, discharged once feeding established.' },
            { id: 'SC2', ga: 34, bw: 2000, mainIssue: 'Mild jaundice + feeding', outcomeSummary: 'Discharged DOL 6', timeToEvent: 'No escalation', similarityScore: 88, details: 'Brief phototherapy then discharge.' },
            { id: 'SC3', ga: 33, bw: 1780, mainIssue: 'Temperature regulation', outcomeSummary: 'Stable in open crib DOL 5, discharged DOL 8', timeToEvent: 'No issues', similarityScore: 82, details: 'Needed incubator initially, transitioned well.' },
            { id: 'SC4', ga: 32, bw: 1700, mainIssue: 'Apnea monitoring', outcomeSummary: 'No events, discharged DOL 10', timeToEvent: 'Caffeine discontinued DOL 7', similarityScore: 72, details: 'Prophylactic caffeine, no significant apnea events recorded.' },
            { id: 'SC5', ga: 34, bw: 2100, mainIssue: 'Brief admission', outcomeSummary: 'Discharged DOL 4', timeToEvent: 'Rapid discharge', similarityScore: 70, details: 'Admitted for observation, met all criteria quickly.' },
        ],
        clinicalInterpretation: {
            summary: 'This 33-week infant is on a favorable trajectory on DOL 5. Now on room air with full oral feeds and stable vitals. Approaching discharge criteria. No active concerns identified. Continue routine monitoring and discharge planning.',
            uncertaintyFlags: ['Hearing screen not completed', 'Car seat test pending'],
        },
    },
];

export function getPatientById(id: string): Patient | undefined {
    return patients.find(p => p.id === id);
}

export function getHighRiskCount(): number {
    return patients.filter(p => p.overallRisk === 'high').length;
}

export function getLastRefreshTime(): string {
    return new Date().toISOString();
}
