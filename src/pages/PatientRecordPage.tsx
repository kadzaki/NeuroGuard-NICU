import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchPatientById, deletePatient } from '../data/api';
import type { PatientRecordResponse, PatientRecordData } from '../data/api';
import './PatientRecordPage.css';

/** Organized sections for displaying the 70+ fields in logical groups. */
const SECTIONS: { title: string; icon: string; fields: { key: keyof PatientRecordData; label: string }[] }[] = [
    {
        title: 'Identité & Dates', icon: '📋',
        fields: [
            { key: 'date_entrée', label: "Date d'entrée" },
            { key: 'date_naissance', label: 'Date de naissance' },
            { key: 'date_sortie', label: 'Date de sortie' },
            { key: 'date_décès', label: 'Date de décès' },
            { key: 'sexe_nouveau_né', label: 'Sexe' },
            { key: 'admis_quel_jour', label: "Jour d'admission" },
        ],
    },
    {
        title: 'Données Familiales', icon: '👨‍👩‍👧',
        fields: [
            { key: 'âge_mère', label: 'Âge de la mère' },
            { key: 'type_mariage', label: 'Type de mariage' },
            { key: 'degré_consanguinité', label: 'Consanguinité' },
            { key: 'ville_origine', label: "Ville d'origine" },
            { key: 'ville_actuelle', label: 'Ville actuelle' },
            { key: 'couverture_sanitaire', label: 'Couverture sanitaire' },
            { key: 'nombre_fausses_accouchement', label: 'Fausses couches' },
        ],
    },
    {
        title: 'Grossesse & Accouchement', icon: '🤰',
        fields: [
            { key: 'type_grossesse', label: 'Type grossesse' },
            { key: 'suivi_grossesse', label: 'Suivi grossesse' },
            { key: 'grossesse_mené_à_terme', label: 'À terme' },
            { key: 'dubowitz', label: 'Dubowitz' },
            { key: 'type_accouchement', label: 'Type accouchement' },
            { key: 'voie_accouchement', label: 'Voie accouchement' },
            { key: 'anamnèse_infectieuse', label: 'Anamnèse infectieuse' },
            { key: 'groupage_maman', label: 'Groupage maman' },
        ],
    },
    {
        title: 'Évaluation à la Naissance', icon: '👶',
        fields: [
            { key: 'APGAR_naissance', label: 'APGAR' },
            { key: 'couleur', label: 'Couleur' },
            { key: 'tonicité', label: 'Tonicité' },
            { key: 'réactivité', label: 'Réactivité' },
            { key: 'RSD', label: 'RSD' },
            { key: 'RA', label: 'RA' },
        ],
    },
    {
        title: 'Hémodynamique & Respiratoire', icon: '❤️',
        fields: [
            { key: 'hémodynamique_FC', label: 'FC' },
            { key: 'hémodynamique_TRC', label: 'TRC' },
            { key: 'respiratoire_SS', label: 'Score Silverman' },
            { key: 'respiratoire_SaO2', label: 'SaO₂' },
            { key: 'respiratoire_FR', label: 'FR' },
        ],
    },
    {
        title: 'Mensurations', icon: '📏',
        fields: [
            { key: 'poids', label: 'Poids' },
            { key: 'taille', label: 'Taille' },
            { key: 'périmètre_crânien', label: 'Périmètre crânien' },
            { key: 'glycémie_capillaire', label: 'Glycémie capillaire' },
        ],
    },
    {
        title: 'Examen Clinique', icon: '🩺',
        fields: [
            { key: 'MV', label: 'Murmure vésiculaire' },
            { key: 'râles_auscultation', label: 'Râles' },
            { key: 'thorax_morphologie', label: 'Thorax' },
            { key: 'abdomen', label: 'Abdomen' },
            { key: 'masse_palpable', label: 'Masse palpable' },
            { key: 'HSMG', label: 'HSMG' },
            { key: 'B1B2', label: 'B1B2' },
            { key: 'souffle_surajouté', label: 'Souffle surajouté' },
            { key: 'bruits_surajoutés', label: 'Bruits surajoutés' },
            { key: 'OGE_sexe', label: 'OGE sexe' },
            { key: 'testicules', label: 'Testicules' },
        ],
    },
    {
        title: 'Bilan Biologique', icon: '🧪',
        fields: [
            { key: 'Hb', label: 'Hb' },
            { key: 'NFS_hb', label: 'NFS Hb' },
            { key: 'plaquettes', label: 'Plaquettes' },
            { key: 'GB', label: 'GB' },
            { key: 'PNN', label: 'PNN' },
            { key: 'CRP', label: 'CRP' },
            { key: 'urée', label: 'Urée' },
            { key: 'créat', label: 'Créatinine' },
            { key: 'ionogramme_Nat', label: 'Na⁺' },
            { key: 'ionogramme_K_plus', label: 'K⁺' },
            { key: 'ionogramme_AÏb', label: 'Albumine iono' },
            { key: 'CPK', label: 'CPK' },
            { key: 'LDH', label: 'LDH' },
            { key: 'calcémie', label: 'Calcémie' },
            { key: 'albuminémie', label: 'Albuminémie' },
            { key: 'TP', label: 'TP' },
            { key: 'lymphopénie', label: 'Lymphopénie' },
            { key: 'ECBU', label: 'ECBU' },
            { key: 'valeur_ECBU', label: 'Valeur ECBU' },
            { key: 'contrôlé_âpres', label: 'Contrôlé après' },
        ],
    },
    {
        title: 'Imagerie & Bilan', icon: '🩻',
        fields: [
            { key: 'bilan_malformatif', label: 'Bilan malformatif' },
            { key: 'radio_thorax', label: 'Radio thorax' },
            { key: 'ETF', label: 'ETF' },
            { key: 'MEC', label: 'MEC' },
        ],
    },
    {
        title: 'Issue', icon: '📌',
        fields: [
            { key: 'décédé', label: 'Décédé' },
        ],
    },
];

export default function PatientRecordPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<PatientRecordResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchPatientById(id)
            .then((data) => {
                if (!data) setError('Dossier patient non trouvé');
                else setRecord(data);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!id || !confirm('Supprimer ce dossier patient ?')) return;
        try {
            await deletePatient(id);
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur';
            setError(message);
        }
    };

    if (loading) {
        return (
            <div className="page-container record-page">
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p>Chargement du dossier...</p>
                </div>
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="page-container record-page">
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2>⚠️ {error || 'Dossier non trouvé'}</h2>
                    <button className="btn btn--primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
                        ← Retour au Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container record-page">
            {/* Header */}
            <div className="record-back-header">
                <button className="btn btn--ghost" onClick={() => navigate('/')}>← Retour</button>
                <h1>📄 Dossier Patient #{record.id}</h1>
            </div>

            {/* Meta */}
            <div className="record-meta glass-card">
                <div className="record-meta-item">
                    🕐 <strong>Créé le:</strong> {new Date(record.created_at).toLocaleString('fr-FR')}
                </div>
                <div className="record-meta-item">
                    🆔 <strong>ID:</strong> {record.id}
                </div>
            </div>

            {/* Structured Fields by Section */}
            {SECTIONS.map((section) => {
                const hasAnyValue = section.fields.some(f => record.record[f.key] != null);
                return (
                    <div className="record-section glass-card animate-in" key={section.title}>
                        <h3 className="record-section__title">
                            <span>{section.icon}</span> {section.title}
                            {!hasAnyValue && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginLeft: '0.5rem' }}>(aucune donnée)</span>}
                        </h3>
                        <div className="record-fields-grid">
                            {section.fields.map(({ key, label }) => {
                                const value = record.record[key];
                                return (
                                    <div className="record-field" key={key}>
                                        <span className="record-field__label">{label}</span>
                                        <span className={`record-field__value ${value == null ? 'record-field__value--null' : ''}`}>
                                            {value ?? '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Raw Report */}
            <div className="record-section glass-card animate-in">
                <h3 className="record-section__title">📝 Rapport Original</h3>
                <div className="raw-report-text">{record.raw_report}</div>
            </div>

            {/* Actions */}
            <div className="record-actions">
                <button className="btn--danger" onClick={handleDelete}>
                    🗑️ Supprimer ce dossier
                </button>
            </div>
        </div>
    );
}
