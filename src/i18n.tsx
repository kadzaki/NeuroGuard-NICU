import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'en' | 'fr';

// ── Translation dictionary ──
const translations: Record<Lang, Record<string, string>> = {
    en: {
        // ── HomePage ──
        'home.title': 'NICU CHU Oujda',
        'home.loading': 'Loading...',
        'home.patients': 'patients',
        'home.active': 'Active',
        'home.highRisk': 'High Risk',
        'home.newReport': '➕ New Report',
        'home.filters': 'Filters',
        'home.filterRisk': 'Risk Level:',
        'home.filterAll': 'All',
        'home.backendError': 'Backend not available',
        'home.backendErrorHint': 'Start the API with',
        'home.emptyTitle': 'No patients registered',
        'home.emptySubtitle': 'Submit a clinical report to start the analysis.',
        'home.colRisk': 'Risk',
        'home.colPatient': 'Patient',
        'home.colGA': 'GA / Weight',
        'home.colSupport': 'Support',
        'home.colTrend': 'Trend',
        'home.colRisk1': 'Risk 1',
        'home.colRisk2': 'Risk 2',
        'home.colRisk3': 'Risk 3',
        'home.legendHigh': 'High — Immediate review',
        'home.legendModerate': 'Moderate — Review within shift',
        'home.legendLow': 'Low — Routine monitoring',

        // ── PatientPage ──
        'patient.back': '← Back',
        'patient.delete': '🗑️ Delete',
        'patient.deleting': '...',
        'patient.confirmDelete': 'Delete this patient record?',
        'patient.notFound': 'Patient Not Found',
        'patient.notFoundDetail': 'No patient with ID:',
        'patient.backToDashboard': '← Back to Dashboard',
        'patient.loadingRecord': 'Loading patient record...',
        'patient.sectionRisk': 'Risk Summary',
        'patient.sectionFactors': 'Contributing Factors',
        'patient.factorsSubtitle': 'Risk factors identified by AI, based on real similar cases.',
        'patient.sectionTrend': 'Trend Timeline',
        'patient.sectionSimilar': 'Similar Cases (RAG — 1230 reports database)',
        'patient.similarSubtitle': 'Real records found in the database. Correlated fields are highlighted.',
        'patient.sectionInterpretation': 'AI Clinical Interpretation',
        'patient.sectionOriginal': 'Original Report',
        'patient.sectionStructured': 'Extracted Structured Data',

        // ── NewReportModal ──
        'modal.title': '📋 New Patient Report',
        'modal.success': 'Report analyzed successfully',
        'modal.fieldsExtracted': 'fields extracted',
        'modal.placeholder': 'Paste the neonatal medical report here...\n\nExample: Male newborn, born 15/02/2026, vaginal delivery, birth weight 1200g, APGAR 7/8...',
        'modal.hint': '💡 Paste a free-text report. The AI will automatically extract structured data.',
        'modal.extractedData': '📊 Extracted Data',
        'modal.close': 'Close',
        'modal.analyzing': 'Analyzing...',
        'modal.submit': '🚀 Analyze Report',

        // ── RiskSummaryCards ──
        'risk.increasing': '↑ Increasing',
        'risk.decreasing': '↓ Improving',
        'risk.stable': '→ Stable',
        'risk.lastChange': 'Last change:',
        'risk.detailText': 'Risk assessment based on continuous monitoring data, clinical notes, and AI pattern matching against historical NICU cases.',
        'risk.horizon': 'Horizon:',
        'risk.confidence': 'Confidence: Moderate',
        'risk.model': 'Model: MedGemma',

        // ── ContributingFactors ──
        'factors.data': '📊 Data',
        'factors.clinicalNote': '📝 Clinical Note',
        'factors.similarCases': '🔗 Similar Cases',

        // ── ClinicalInterpretation ──
        'interp.badge': 'MedGemma Clinical Analysis',
        'interp.model': 'Model: MedGemma',
        'interp.confidence': 'Confidence: Moderate–High',
        'interp.generated': 'Generated: Just now',
        'interp.uncertaintyTitle': '⚠️ Uncertainty Flags',

        // ── RagSimilarCases ──
        'rag.empty': 'No similar cases found.',
        'rag.legendHigh': 'Strong correlation',
        'rag.legendMedium': 'Medium correlation',
        'rag.legendLow': 'Weak correlation',
        'rag.deceased': '⚫ Deceased',
        'rag.survived': '🟢 Survived',
        'rag.criteria': 'criteria',
        'rag.correlatedFields': '🔗 Correlated fields',
        'rag.otherFields': '📋 Other record data',

        // ── Common ──
        'common.high': 'High',
        'common.moderate': 'Moderate',
        'common.low': 'Low',
        'common.male': '♂ Male',
        'common.female': '♀ Female',
        'common.lang': '🌐 FR',
    },
    fr: {
        // ── HomePage ──
        'home.title': 'NICU CHU Oujda',
        'home.loading': 'Chargement...',
        'home.patients': 'patients',
        'home.active': 'Actifs',
        'home.highRisk': 'Haut Risque',
        'home.newReport': '➕ Nouveau Rapport',
        'home.filters': 'Filtres',
        'home.filterRisk': 'Niveau de risque :',
        'home.filterAll': 'Tous',
        'home.backendError': 'Backend indisponible',
        'home.backendErrorHint': 'Démarrez l\'API avec',
        'home.emptyTitle': 'Aucun patient enregistré',
        'home.emptySubtitle': 'Soumettez un rapport clinique pour commencer l\'analyse.',
        'home.colRisk': 'Risque',
        'home.colPatient': 'Patient',
        'home.colGA': 'AG / Poids',
        'home.colSupport': 'Support',
        'home.colTrend': 'Tendance',
        'home.colRisk1': 'Risque 1',
        'home.colRisk2': 'Risque 2',
        'home.colRisk3': 'Risque 3',
        'home.legendHigh': 'Élevé — Revue immédiate',
        'home.legendModerate': 'Modéré — Revue dans le quart',
        'home.legendLow': 'Faible — Surveillance de routine',

        // ── PatientPage ──
        'patient.back': '← Retour',
        'patient.delete': '🗑️ Supprimer',
        'patient.deleting': '...',
        'patient.confirmDelete': 'Supprimer ce dossier patient ?',
        'patient.notFound': 'Patient Non Trouvé',
        'patient.notFoundDetail': 'Aucun patient avec l\'ID :',
        'patient.backToDashboard': '← Retour au Dashboard',
        'patient.loadingRecord': 'Chargement du dossier patient...',
        'patient.sectionRisk': 'Résumé des Risques',
        'patient.sectionFactors': 'Facteurs Contributifs',
        'patient.factorsSubtitle': 'Facteurs de risque identifiés par l\'IA, fondés sur les cas similaires réels.',
        'patient.sectionTrend': 'Chronologie des Tendances',
        'patient.sectionSimilar': 'Cas Similaires (RAG — base de 1230 dossiers)',
        'patient.similarSubtitle': 'Dossiers réels retrouvés dans la base de données. Les champs corrélés sont mis en évidence.',
        'patient.sectionInterpretation': 'Interprétation Clinique IA',
        'patient.sectionOriginal': 'Rapport Original',
        'patient.sectionStructured': 'Données Structurées Extraites',

        // ── NewReportModal ──
        'modal.title': '📋 Nouveau Rapport Patient',
        'modal.success': 'Rapport analysé avec succès',
        'modal.fieldsExtracted': 'champs extraits',
        'modal.placeholder': 'Collez le compte rendu médical du nouveau-né ici...\n\nExemple: Nouveau-né de sexe masculin, né le 15/02/2026 par voie basse, poids de naissance 1200g, APGAR 7/8...',
        'modal.hint': '💡 Collez un compte rendu en texte libre. L\'IA extraira automatiquement les données structurées.',
        'modal.extractedData': '📊 Données Extraites',
        'modal.close': 'Fermer',
        'modal.analyzing': 'Analyse en cours...',
        'modal.submit': '🚀 Analyser le Rapport',

        // ── RiskSummaryCards ──
        'risk.increasing': '↑ En hausse',
        'risk.decreasing': '↓ En baisse',
        'risk.stable': '→ Stable',
        'risk.lastChange': 'Dernier changement :',
        'risk.detailText': 'Évaluation des risques basée sur les données de surveillance continue, les notes cliniques et la correspondance IA avec des cas NICU historiques.',
        'risk.horizon': 'Horizon :',
        'risk.confidence': 'Confiance : Modérée',
        'risk.model': 'Modèle : MedGemma',

        // ── ContributingFactors ──
        'factors.data': '📊 Données',
        'factors.clinicalNote': '📝 Note Clinique',
        'factors.similarCases': '🔗 Cas Similaires',

        // ── ClinicalInterpretation ──
        'interp.badge': 'Analyse Clinique MedGemma',
        'interp.model': 'Modèle : MedGemma',
        'interp.confidence': 'Confiance : Modérée–Élevée',
        'interp.generated': 'Généré : À l\'instant',
        'interp.uncertaintyTitle': '⚠️ Points d\'incertitude',

        // ── RagSimilarCases ──
        'rag.empty': 'Aucun cas similaire retrouvé.',
        'rag.legendHigh': 'Forte corrélation',
        'rag.legendMedium': 'Corrélation moyenne',
        'rag.legendLow': 'Corrélation faible',
        'rag.deceased': '⚫ Décédé',
        'rag.survived': '🟢 Survivant',
        'rag.criteria': 'critères',
        'rag.correlatedFields': '🔗 Champs corrélés',
        'rag.otherFields': '📋 Autres données du dossier',

        // ── Common ──
        'common.high': 'Élevé',
        'common.moderate': 'Modéré',
        'common.low': 'Faible',
        'common.male': '♂ Masculin',
        'common.female': '♀ Féminin',
        'common.lang': '🌐 EN',
    },
};

// ── Context ──

interface I18nContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
    toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'en',
    setLang: () => { },
    t: (key: string) => key,
    toggleLang: () => { },
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>(() => {
        const saved = localStorage.getItem('nicu-lang');
        return (saved === 'fr' ? 'fr' : 'en') as Lang;
    });

    const t = useCallback(
        (key: string): string => translations[lang][key] ?? translations.en[key] ?? key,
        [lang],
    );

    const toggleLang = useCallback(() => {
        setLang(prev => {
            const next = prev === 'en' ? 'fr' : 'en';
            localStorage.setItem('nicu-lang', next);
            return next;
        });
    }, []);

    const handleSetLang = useCallback((newLang: Lang) => {
        localStorage.setItem('nicu-lang', newLang);
        setLang(newLang);
    }, []);

    return (
        <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, toggleLang }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
