import { useState } from 'react';
import { submitReport } from '../data/api';
import type { PatientRecordResponse, PatientRecordData } from '../data/api';
import { useI18n } from '../i18n';
import './NewReportModal.css';

interface Props {
    onClose: () => void;
    onSuccess: (record: PatientRecordResponse) => void;
}

// Field labels are medical terminology — kept in French always
const FIELD_LABELS: Record<string, string> = {
    "date_entrée": "Date d'entrée",
    "date_décès": "Date de décès",
    "date_sortie": "Date de sortie",
    "sexe_nouveau_né": "Sexe",
    "date_naissance": "Date de naissance",
    "type_mariage": "Type de mariage",
    "degré_consanguinité": "Consanguinité",
    "ville_origine": "Ville d'origine",
    "ville_actuelle": "Ville actuelle",
    "couverture_sanitaire": "Couverture sanitaire",
    "admis_quel_jour": "Jour d'admission",
    "âge_mère": "Âge de la mère",
    "nombre_fausses_accouchement": "Fausses couches",
    "type_grossesse": "Type grossesse",
    "suivi_grossesse": "Suivi grossesse",
    "grossesse_mené_à_terme": "À terme",
    "dubowitz": "Dubowitz",
    "type_accouchement": "Type accouchement",
    "voie_accouchement": "Voie accouchement",
    "anamnèse_infectieuse": "Anamnèse infectieuse",
    "groupage_maman": "Groupage maman",
    "APGAR_naissance": "APGAR",
    "couleur": "Couleur",
    "tonicité": "Tonicité",
    "réactivité": "Réactivité",
    "RSD": "RSD",
    "RA": "RA",
    "hémodynamique_FC": "FC",
    "hémodynamique_TRC": "TRC",
    "respiratoire_SS": "Score Silverman",
    "respiratoire_SaO2": "SaO₂",
    "respiratoire_FR": "FR",
    "glycémie_capillaire": "Glycémie",
    "poids": "Poids",
    "taille": "Taille",
    "périmètre_crânien": "PC",
    "MV": "MV",
    "râles_auscultation": "Râles",
    "thorax_morphologie": "Thorax",
    "abdomen": "Abdomen",
    "masse_palpable": "Masse palpable",
    "HSMG": "HSMG",
    "B1B2": "B1B2",
    "souffle_surajouté": "Souffle",
    "bruits_surajoutés": "Bruits surajoutés",
    "Hb": "Hb",
    "OGE_sexe": "OGE sexe",
    "testicules": "Testicules",
    "bilan_malformatif": "Bilan malformatif",
    "radio_thorax": "Radio thorax",
    "MEC": "MEC",
    "NFS_hb": "NFS Hb",
    "plaquettes": "Plaquettes",
    "urée": "Urée",
    "créat": "Créatinine",
    "ionogramme_Nat": "Na⁺",
    "ionogramme_K_plus": "K⁺",
    "ionogramme_AÏb": "Albumine",
    "GB": "GB",
    "ETF": "ETF",
    "PNN": "PNN",
    "CPK": "CPK",
    "ECBU": "ECBU",
    "valeur_ECBU": "Valeur ECBU",
    "lymphopénie": "Lymphopénie",
    "CRP": "CRP",
    "contrôlé_âpres": "Contrôlé après",
    "LDH": "LDH",
    "calcémie": "Calcémie",
    "albuminémie": "Albuminémie",
    "TP": "TP",
    "décédé": "Décédé",
};

export default function NewReportModal({ onClose, onSuccess }: Props) {
    const { t } = useI18n();
    const [reportText, setReportText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PatientRecordResponse | null>(null);

    const handleSubmit = async () => {
        if (!reportText.trim() || loading) return;
        setLoading(true);
        setError(null);

        try {
            const res = await submitReport(reportText);
            setResult(res);
            onSuccess(res);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const nonNullFields = result
        ? Object.entries(result.record).filter(([, v]) => v != null)
        : [];

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
            <div className="modal-content">
                {/* Header */}
                <div className="modal-header">
                    <h2>{t('modal.title')}</h2>
                    <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
                </div>

                {/* Error Banner */}
                {error && <div className="modal-error">⚠️ {error}</div>}

                {/* Success Banner */}
                {result && (
                    <div className="modal-success">
                        ✅ {t('modal.success')} — {nonNullFields.length} {t('modal.fieldsExtracted')}
                    </div>
                )}

                {/* Textarea */}
                {!result && (
                    <div className="modal-body">
                        <textarea
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder={t('modal.placeholder')}
                            disabled={loading}
                        />
                        <p className="modal-hint">
                            {t('modal.hint')}
                        </p>
                    </div>
                )}

                {/* Parsed Preview — field labels & values are clinical data, stay in French */}
                {result && (
                    <div className="parsed-preview">
                        <h3>{t('modal.extractedData')}</h3>
                        <div className="parsed-grid">
                            {Object.entries(FIELD_LABELS).map(([key, label]) => {
                                const value = result.record[key as keyof PatientRecordData];
                                return (
                                    <div className="parsed-field" key={key}>
                                        <span className="parsed-field__label">{label}</span>
                                        <span className={`parsed-field__value ${value == null ? 'parsed-field__value--null' : ''}`}>
                                            {value ?? '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="modal-actions">
                    {result ? (
                        <button className="btn--submit" onClick={onClose}>
                            {t('modal.close')}
                        </button>
                    ) : (
                        <button
                            className="btn--submit"
                            onClick={handleSubmit}
                            disabled={!reportText.trim() || loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    {t('modal.analyzing')}
                                </>
                            ) : (
                                t('modal.submit')
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
