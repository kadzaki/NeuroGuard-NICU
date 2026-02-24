import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPatientById, deletePatient } from '../data/api';
import type { PatientRecordResponse, DashboardData, DashboardRiskScore, DashboardContributingFactor, DashboardClinicalInterpretation } from '../data/api';
import { useI18n } from '../i18n';
import RiskSummaryCards from '../components/RiskSummaryCards';
import ContributingFactors from '../components/ContributingFactors';
import TrendTimeline from '../components/TrendTimeline';
import RagSimilarCases from '../components/RagSimilarCases';
import ClinicalInterpretation from '../components/ClinicalInterpretation';
import './PatientPage.css';

function adaptRisks(risks: DashboardRiskScore[]) {
    return risks.map(r => ({
        label: r.label,
        horizon: r.horizon,
        level: r.level as 'low' | 'moderate' | 'high',
        probabilityRange: r.probabilityRange,
        trend: r.trend as 'increasing' | 'decreasing' | 'stable',
        delta: r.delta,
        details: r.details,
    }));
}

function adaptFactors(factors: DashboardContributingFactor[]) {
    return factors.map(f => ({
        id: f.id,
        text: f.text,
        trend: f.trend as 'increasing' | 'decreasing' | 'stable',
        dataSnippet: f.dataSnippet,
        noteExcerpt: f.noteExcerpt,
        similarCaseSummary: f.similarCaseSummary,
    }));
}

function adaptInterpretation(interp: DashboardClinicalInterpretation) {
    return {
        summary: interp.summary,
        uncertaintyFlags: interp.uncertaintyFlags || [],
    };
}

export default function PatientPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useI18n();
    const [record, setRecord] = useState<PatientRecordResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchPatientById(id)
            .then(data => {
                setRecord(data);
                if (!data) setError('Patient not found');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!id || !window.confirm(t('patient.confirmDelete'))) return;
        setDeleting(true);
        try {
            await deletePatient(id);
            navigate('/');
        } catch {
            setError('Failed to delete');
        }
        setDeleting(false);
    };

    if (loading) {
        return (
            <div className="page-container patient-page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <div className="loading-spinner" />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{t('patient.loadingRecord')}</p>
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="page-container patient-page">
                <div className="patient-not-found glass-card">
                    <h2>{t('patient.notFound')}</h2>
                    <p>{error || `${t('patient.notFoundDetail')} ${id}`}</p>
                    <button className="btn btn--primary" onClick={() => navigate('/')}>{t('patient.backToDashboard')}</button>
                </div>
            </div>
        );
    }

    const d: DashboardData | undefined = record.dashboard;

    return (
        <div className="page-container patient-page">
            {/* Back Button + Patient Header */}
            <header className="patient-header">
                <button className="btn btn--ghost patient-header__back" onClick={() => navigate('/')}>
                    {t('patient.back')}
                </button>
                <div className="patient-header__info">
                    <div className="patient-header__top-row">
                        {/* Patient name = clinical data, stays in original language */}
                        <h1 className="patient-header__name">{d?.name || 'Patient'}</h1>
                        <span className={`risk-badge risk-badge--${d?.overallRisk || 'low'}`}>
                            {d?.overallRisk === 'high' ? '🔴' : d?.overallRisk === 'moderate' ? '🟠' : '🟢'} {(d?.overallRisk || 'low').toUpperCase()}
                        </span>
                    </div>
                    <div className="patient-header__meta">
                        <span>{d?.mrn || `#${record.id}`}</span>
                        <span className="patient-header__sep">•</span>
                        <span>{d?.sex === 'M' ? t('common.male') : d?.sex === 'F' ? t('common.female') : '—'}</span>
                        <span className="patient-header__sep">•</span>
                        <span>GA {d?.ga ? `${d.ga}SA` : '—'}</span>
                        <span className="patient-header__sep">•</span>
                        <span>{d?.bw ? `${d.bw}g` : '—'}</span>
                        <span className="patient-header__sep">•</span>
                        <span>D{d?.dayOfLife ?? '?'}</span>
                        <span className="patient-header__sep">•</span>
                        {/* Current support = clinical data */}
                        <span className="chip">{d?.currentSupport || '—'}</span>
                    </div>
                </div>
                <button
                    className="btn btn--ghost"
                    style={{ color: 'var(--risk-high)', marginLeft: 'auto' }}
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? t('patient.deleting') : t('patient.delete')}
                </button>
            </header>

            {/* Section 1: Risk Summary Cards */}
            {d?.risks && d.risks.length > 0 && (
                <section className="patient-section animate-in">
                    <h2 className="section-heading"><span className="icon">🔵</span> {t('patient.sectionRisk')}</h2>
                    <RiskSummaryCards risks={adaptRisks(d.risks)} />
                </section>
            )}

            {/* Section 2: Contributing Factors */}
            {d?.contributingFactors && d.contributingFactors.length > 0 && (
                <section className="patient-section animate-in animate-in-delay-1">
                    <h2 className="section-heading"><span className="icon">🟣</span> {t('patient.sectionFactors')}</h2>
                    <p className="section-subtitle">{t('patient.factorsSubtitle')}</p>
                    <ContributingFactors factors={adaptFactors(d.contributingFactors)} />
                </section>
            )}

            {/* Section 3: Trend Timeline */}
            {d?.vitals && d.vitals.length > 0 && (
                <section className="patient-section animate-in animate-in-delay-2">
                    <h2 className="section-heading"><span className="icon">🟢</span> {t('patient.sectionTrend')}</h2>
                    <TrendTimeline vitals={d.vitals as any} interventions={d.interventions as any || []} />
                </section>
            )}

            {/* Section 4: Similar Historical Cases (from RAG) */}
            {record.rag_cases && record.rag_cases.length > 0 && (
                <section className="patient-section animate-in animate-in-delay-3">
                    <h2 className="section-heading"><span className="icon">🟡</span> {t('patient.sectionSimilar')}</h2>
                    <p className="section-subtitle">{t('patient.similarSubtitle')}</p>
                    <RagSimilarCases cases={record.rag_cases} />
                </section>
            )}

            {/* Section 5: Clinical Interpretation */}
            {d?.clinicalInterpretation && (
                <section className="patient-section animate-in animate-in-delay-4">
                    <h2 className="section-heading"><span className="icon">🔴</span> {t('patient.sectionInterpretation')}</h2>
                    <ClinicalInterpretation data={adaptInterpretation(d.clinicalInterpretation)} />
                </section>
            )}

            {/* Raw Report — clinical data, stays in French */}
            <section className="patient-section animate-in animate-in-delay-5">
                <h2 className="section-heading"><span className="icon">📝</span> {t('patient.sectionOriginal')}</h2>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'inherit',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                    }}>
                        {record.raw_report}
                    </pre>
                </div>
            </section>

            {/* Structured Fields — clinical data, stays in French */}
            <section className="patient-section animate-in animate-in-delay-5">
                <h2 className="section-heading"><span className="icon">📊</span> {t('patient.sectionStructured')}</h2>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '0.75rem',
                    }}>
                        {Object.entries(record.record || {}).map(([key, val]) => {
                            if (val == null || val === '') return null;
                            return (
                                <div key={key} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '0.5rem 0.75rem', borderRadius: '8px',
                                    background: 'var(--bg-surface)',
                                }}>
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>{key}</span>
                                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>{String(val)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
