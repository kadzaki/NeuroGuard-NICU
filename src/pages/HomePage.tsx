import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPatients } from '../data/api';
import type { PatientRecordResponse, DashboardData } from '../data/api';
import { useI18n } from '../i18n';
import NewReportModal from '../components/NewReportModal';
import './HomePage.css';

type RiskLevel = 'low' | 'moderate' | 'high';
const riskOrder: Record<RiskLevel, number> = { high: 0, moderate: 1, low: 2 };

function trendSymbol(trend: string) {
    if (trend === 'increasing') return '↑';
    if (trend === 'decreasing') return '↓';
    return '→';
}

function riskEmoji(level: string) {
    if (level === 'high') return '🔴';
    if (level === 'moderate') return '🟠';
    return '🟢';
}

export default function HomePage() {
    const navigate = useNavigate();
    const { t, toggleLang } = useI18n();
    const [filterOpen, setFilterOpen] = useState(false);
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
    const [showModal, setShowModal] = useState(false);
    const [patients, setPatients] = useState<PatientRecordResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPatients = () => {
        setLoading(true);
        fetchPatients()
            .then(data => { setPatients(data); setError(null); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPatients(); }, []);

    const filtered = useMemo(() => {
        let list = [...patients];
        if (riskFilter !== 'all') {
            list = list.filter(p => {
                const risk = p.dashboard?.overallRisk || 'low';
                return risk === riskFilter;
            });
        }
        list.sort((a, b) => {
            const ra = riskOrder[(a.dashboard?.overallRisk || 'low') as RiskLevel] ?? 2;
            const rb = riskOrder[(b.dashboard?.overallRisk || 'low') as RiskLevel] ?? 2;
            return ra - rb;
        });
        return list;
    }, [patients, riskFilter]);

    const highCount = patients.filter(p => p.dashboard?.overallRisk === 'high').length;

    return (
        <div className="page-container home-page">
            {/* Top Bar */}
            <header className="top-bar glass-card">
                <div className="top-bar__left">
                    <div className="top-bar__unit">
                        <span className="top-bar__icon">🏥</span>
                        <h1 className="top-bar__title">{t('home.title')}</h1>
                    </div>
                    <span className="top-bar__refresh">
                        {loading ? t('home.loading') : `${patients.length} ${t('home.patients')}`}
                    </span>
                </div>
                <div className="top-bar__right">
                    <div className="stat-pill">
                        <span className="stat-pill__label">{t('home.active')}</span>
                        <span className="stat-pill__value">{patients.length}</span>
                    </div>
                    {highCount > 0 && (
                        <div className="stat-pill stat-pill--danger">
                            <span className="stat-pill__label">{t('home.highRisk')}</span>
                            <span className="stat-pill__value">{highCount}</span>
                        </div>
                    )}
                    <button
                        className="btn btn--primary btn--new-report"
                        onClick={() => setShowModal(true)}
                    >
                        {t('home.newReport')}
                    </button>
                    <button
                        className="btn btn--ghost btn--lang"
                        onClick={toggleLang}
                        title="Switch language"
                    >
                        {t('common.lang')}
                    </button>
                    <button
                        className={`btn btn--ghost ${filterOpen ? 'active' : ''}`}
                        onClick={() => setFilterOpen(!filterOpen)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        {t('home.filters')}
                    </button>
                </div>
            </header>

            {/* Filter Panel */}
            {filterOpen && (
                <div className="filter-panel glass-card animate-in">
                    <span className="filter-panel__label">{t('home.filterRisk')}</span>
                    {(['all', 'high', 'moderate', 'low'] as const).map(level => (
                        <button
                            key={level}
                            className={`btn btn--ghost ${riskFilter === level ? 'active' : ''}`}
                            onClick={() => setRiskFilter(level)}
                        >
                            {level === 'all' ? t('home.filterAll') : `${riskEmoji(level)} ${t(`common.${level}`)}`}
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="glass-card" style={{ padding: '1rem', color: 'var(--risk-high)', marginBottom: '1rem' }}>
                    ⚠️ {t('home.backendError')}: {error}. {t('home.backendErrorHint')} <code>python -m uvicorn main:app --port 8000</code>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && patients.length === 0 && (
                <div className="empty-state glass-card animate-in" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>{t('home.emptyTitle')}</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {t('home.emptySubtitle')}
                    </p>
                    <button className="btn btn--primary btn--new-report" onClick={() => setShowModal(true)}>
                        {t('home.newReport')}
                    </button>
                </div>
            )}

            {/* Patient List */}
            {filtered.length > 0 && (
                <>
                    <div className="patient-list-header">
                        <span className="col-risk">{t('home.colRisk')}</span>
                        <span className="col-patient">{t('home.colPatient')}</span>
                        <span className="col-ga">{t('home.colGA')}</span>
                        <span className="col-support">{t('home.colSupport')}</span>
                        <span className="col-trend">{t('home.colTrend')}</span>
                        <span className="col-risks">{t('home.colRisk1')}</span>
                        <span className="col-risks">{t('home.colRisk2')}</span>
                        <span className="col-risks">{t('home.colRisk3')}</span>
                    </div>

                    <div className="patient-list">
                        {filtered.map((patient, i) => (
                            <PatientRow
                                key={patient.id}
                                patient={patient}
                                index={i}
                                onClick={() => navigate(`/patient/${patient.id}`)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Legend */}
            {patients.length > 0 && (
                <div className="legend">
                    <span className="legend__item"><span className="risk-dot risk-dot--high" /> {t('home.legendHigh')}</span>
                    <span className="legend__item"><span className="risk-dot risk-dot--moderate" /> {t('home.legendModerate')}</span>
                    <span className="legend__item"><span className="risk-dot risk-dot--low" /> {t('home.legendLow')}</span>
                </div>
            )}

            {/* New Report Modal */}
            {showModal && (
                <NewReportModal
                    onClose={() => setShowModal(false)}
                    onSuccess={loadPatients}
                />
            )}
        </div>
    );
}

function PatientRow({ patient, index, onClick }: { patient: PatientRecordResponse; index: number; onClick: () => void }) {
    const d: DashboardData | undefined = patient.dashboard;
    const overallRisk = d?.overallRisk || 'low';
    const risk0 = d?.risks?.[0];
    const risk1 = d?.risks?.[1];
    const risk2 = d?.risks?.[2];

    return (
        <div
            className={`patient-row glass-card animate-in animate-in-delay-${Math.min(index + 1, 5)}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            {/* Risk Badge */}
            <div className="col-risk">
                <span className={`risk-badge risk-badge--${overallRisk}`}>
                    {riskEmoji(overallRisk)} {overallRisk.toUpperCase()}
                </span>
            </div>

            {/* Patient Info — patient data stays in original language */}
            <div className="col-patient">
                <span className="patient-row__name">{d?.name || patient.record?.sexe_nouveau_né || 'Patient'}</span>
                <span className="patient-row__mrn">{d?.mrn || `#${patient.id}`}</span>
            </div>

            {/* GA / BW */}
            <div className="col-ga">
                <span className="patient-row__ga">{d?.ga ? `${d.ga}SA` : '—'}</span>
                <span className="patient-row__bw">{d?.bw ? `${d.bw}g` : '—'}</span>
            </div>

            {/* Current Support — patient data */}
            <div className="col-support">
                <span className="chip">{d?.currentSupport || '—'}</span>
            </div>

            {/* Overall Trend */}
            <div className="col-trend">
                <span className={`trend-arrow trend-arrow--${d?.overallTrend || 'stable'}`}>
                    {trendSymbol(d?.overallTrend || 'stable')}
                </span>
            </div>

            {/* Risk Mini Cards */}
            {[risk0, risk1, risk2].map((risk, ri) => (
                <div className="col-risks" key={ri}>
                    {risk ? (
                        <div className={`mini-risk-card mini-risk-card--${risk.level}`}>
                            <span className="mini-risk-card__level">{riskEmoji(risk.level)} {risk.probabilityRange}</span>
                            <span className={`mini-risk-card__trend trend-arrow trend-arrow--${risk.trend}`}>
                                {trendSymbol(risk.trend)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted">—</span>
                    )}
                </div>
            ))}
        </div>
    );
}
