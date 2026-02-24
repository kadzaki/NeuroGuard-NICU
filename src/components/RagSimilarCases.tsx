import { useState, Fragment } from 'react';
import type { RagCase, RagCaseField } from '../data/api';
import { useI18n } from '../i18n';
import './RagSimilarCases.css';

interface Props {
    cases: RagCase[];
}

function scoreLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
}

/** Highlight keyword matches inside a text string */
function HighlightedValue({ value, words }: { value: string; words?: string[] }) {
    if (!words || words.length === 0) return <>{value}</>;

    const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = value.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                words.some(w => w.toLowerCase() === part.toLowerCase())
                    ? <span key={i} className="rag-highlight-word">{part}</span>
                    : <Fragment key={i}>{part}</Fragment>
            )}
        </>
    );
}

function FieldRow({ field }: { field: RagCaseField }) {
    const matchClass = field.isMatch ? `rag-field--match-${field.matchStrength}` : 'rag-field--no-match';

    return (
        <div className={`rag-field ${matchClass}`}>
            <span className="rag-field__label">{field.label}</span>
            <span className="rag-field__value">
                <HighlightedValue value={field.value} words={field.highlightWords} />
                {field.isMatch && field.matchReason && (
                    <span className={`rag-field__reason rag-field__reason--${field.matchStrength}`}>
                        {field.matchReason}
                    </span>
                )}
            </span>
        </div>
    );
}

/** Clinical report sections — same order as PatientRecordPage */
const REPORT_SECTIONS: { title: string; icon: string; keys: string[] }[] = [
    {
        title: 'Identité & Dates', icon: '📋',
        keys: ['date_entrée', 'date_naissance', 'date_sortie', 'date_décès', 'sexe_nouveau_né', 'admis_quel_jour'],
    },
    {
        title: 'Données Familiales', icon: '👨‍👩‍👧',
        keys: ['âge_mère', 'antécédent_mère', 'type_mariage', 'degré_consanguinité', 'ville_origine', 'ville_actuelle', 'couverture_sanitaire', 'nombre_fausses_accouchement'],
    },
    {
        title: 'Grossesse & Accouchement', icon: '🤰',
        keys: ['type_grossesse', 'suivi_grossesse', 'grossesse_mené_à_terme', 'dubowitz', 'type_accouchement', 'voie_accouchement', 'anamnèse_infectieuse', 'groupage_maman'],
    },
    {
        title: 'Évaluation Naissance', icon: '👶',
        keys: ['APGAR_naissance', 'couleur', 'tonicité', 'réactivité', 'RSD', 'RA'],
    },
    {
        title: 'Hémodynamique & Respiratoire', icon: '❤️',
        keys: ['hémodynamique_FC', 'hémodynamique_TRC', 'respiratoire_SS', 'respiratoire_SaO2', 'respiratoire_FR'],
    },
    {
        title: 'Mensurations', icon: '📏',
        keys: ['poids', 'taille', 'périmètre_crânien', 'glycémie_capillaire'],
    },
    {
        title: 'Examen Clinique', icon: '🩺',
        keys: ['MV', 'râles_auscultation', 'thorax_morphologie', 'abdomen', 'masse_palpable', 'HSMG', 'B1B2', 'souffle_surajouté', 'bruits_surajoutés', 'OGE_sexe', 'testicules'],
    },
    {
        title: 'Bilan Biologique', icon: '🧪',
        keys: ['Hb', 'NFS_hb', 'plaquettes', 'GB', 'PNN', 'CRP', 'urée', 'créat', 'ionogramme_Nat', 'ionogramme_K_plus', 'ionogramme_AÏb', 'CPK', 'LDH', 'calcémie', 'albuminémie', 'TP', 'lymphopénie', 'ECBU', 'valeur_ECBU', 'contrôlé_âpres'],
    },
    {
        title: 'Imagerie & Prise en charge', icon: '🩻',
        keys: ['bilan_malformatif', 'radio_thorax', 'ETF', 'MEC', 'plan_infectieux', 'plan_digestive', 'plan_métabolique', 'hémoculture'],
    },
    {
        title: 'Diagnostic & Issue', icon: '📌',
        keys: ['diagnostic_admission', 'diagnostic_sortie', 'raison_admission', 'décédé'],
    },
];

/** Group fields into clinical sections; unmatched fields go into "Other" */
function groupFieldsIntoSections(fields: RagCaseField[]): { title: string; icon: string; fields: RagCaseField[] }[] {
    const fieldMap = new Map<string, RagCaseField>();
    for (const f of fields) {
        fieldMap.set(f.key, f);
    }

    const usedKeys = new Set<string>();
    const sections: { title: string; icon: string; fields: RagCaseField[] }[] = [];

    for (const section of REPORT_SECTIONS) {
        const sectionFields: RagCaseField[] = [];
        for (const key of section.keys) {
            const field = fieldMap.get(key);
            if (field) {
                sectionFields.push(field);
                usedKeys.add(key);
            }
        }
        if (sectionFields.length > 0) {
            sections.push({ title: section.title, icon: section.icon, fields: sectionFields });
        }
    }

    // Collect any fields not in predefined sections
    const remaining = fields.filter(f => !usedKeys.has(f.key));
    if (remaining.length > 0) {
        sections.push({ title: 'Autres données', icon: '📝', fields: remaining });
    }

    return sections;
}

export default function RagSimilarCases({ cases }: Props) {
    const { t } = useI18n();
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    if (!cases || cases.length === 0) {
        return <p style={{ color: 'var(--text-muted)' }}>{t('rag.empty')}</p>;
    }

    return (
        <div className="rag-cases">
            {/* Legend */}
            <div className="rag-legend">
                <span className="rag-legend__item">
                    <span className="rag-legend__swatch rag-legend__swatch--high" />
                    {t('rag.legendHigh')}
                </span>
                <span className="rag-legend__item">
                    <span className="rag-legend__swatch rag-legend__swatch--medium" />
                    {t('rag.legendMedium')}
                </span>
                <span className="rag-legend__item">
                    <span className="rag-legend__swatch rag-legend__swatch--low" />
                    {t('rag.legendLow')}
                </span>
            </div>

            {cases.map((ragCase, i) => {
                const isOpen = expandedIdx === i;
                const level = scoreLevel(ragCase.similarity_score);
                const reportSections = isOpen ? groupFieldsIntoSections(ragCase.fields || []) : [];

                return (
                    <div key={i} className="rag-case-card glass-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                        {/* Header */}
                        <div className="rag-case-header" onClick={() => setExpandedIdx(isOpen ? null : i)}>
                            <div className="rag-case-header__left">
                                <span className="rag-case-rank">#{i + 1}</span>

                                <div className="rag-case-score">
                                    <div className="rag-case-score__bar">
                                        <div
                                            className={`rag-case-score__fill rag-case-score__fill--${level}`}
                                            style={{ width: `${ragCase.similarity_score}%` }}
                                        />
                                    </div>
                                    <span className="rag-case-score__pct">{ragCase.similarity_score}%</span>
                                </div>

                                <div className="rag-case-summary">
                                    <span className={`rag-case-tag ${ragCase.is_deceased ? 'rag-case-tag--deceased' : 'rag-case-tag--survived'}`}>
                                        {ragCase.is_deceased ? t('rag.deceased') : t('rag.survived')}
                                    </span>
                                    <span className="rag-case-tag rag-case-tag--match">
                                        {ragCase.match_count}/{ragCase.total_match_fields} {t('rag.criteria')}
                                    </span>
                                    {ragCase.matches
                                        ?.filter(m => m.strength === 'high')
                                        .slice(0, 3)
                                        .map((m, j) => (
                                            <span key={j} className="rag-case-tag rag-case-tag--match">
                                                ✓ {m.label}
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>

                            <span className={`rag-case-expand ${isOpen ? 'open' : ''}`}>▼</span>
                        </div>

                        {/* Expanded Body — Full Clinical Report */}
                        {isOpen && (
                            <div className="rag-case-body">
                                {/* Match summary strip */}
                                {ragCase.matches && ragCase.matches.length > 0 && (
                                    <div className="rag-match-strip">
                                        {ragCase.matches
                                            .filter(m => m.strength !== 'none')
                                            .map((m, j) => (
                                                <span key={j} className={`rag-match-pill rag-match-pill--${m.strength}`}>
                                                    {m.strength === 'high' ? '✓' : m.strength === 'medium' ? '≈' : '~'} {m.label}: {m.reason}
                                                </span>
                                            ))
                                        }
                                    </div>
                                )}

                                {/* Full report organized by clinical sections */}
                                {reportSections.map((section, si) => (
                                    <div key={si} className="rag-report-section">
                                        <h4 className="rag-report-section__title">
                                            <span>{section.icon}</span> {section.title}
                                        </h4>
                                        <div className="rag-fields-grid">
                                            {section.fields.map((f, j) => (
                                                <FieldRow key={j} field={f} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
