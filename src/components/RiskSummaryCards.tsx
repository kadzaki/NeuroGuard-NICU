import { useState } from 'react';
import type { RiskScore, RiskLevel, TrendDirection } from '../data/types';
import { useI18n } from '../i18n';

function riskEmoji(level: RiskLevel) {
    if (level === 'high') return '🔴';
    if (level === 'moderate') return '🟠';
    return '🟢';
}

function levelLabel(level: RiskLevel) {
    return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function RiskSummaryCards({ risks }: { risks: RiskScore[] }) {
    const { t } = useI18n();
    const [expanded, setExpanded] = useState<number | null>(null);

    function trendSymbol(trend: TrendDirection) {
        if (trend === 'increasing') return t('risk.increasing');
        if (trend === 'decreasing') return t('risk.decreasing');
        return t('risk.stable');
    }

    return (
        <div className="risk-summary-cards">
            {risks.map((risk, i) => (
                <div
                    key={i}
                    className={`risk-summary-card glass-card risk-summary-card--${risk.level} ${expanded === i ? 'expanded' : ''}`}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                >
                    <div className="risk-summary-card__header">
                        <div className="risk-summary-card__info">
                            {/* risk.horizon & risk.label = clinical data, stay in original language */}
                            <span className="risk-summary-card__horizon">{risk.horizon} {risk.label.replace(/^\d+h\s*/, '')}</span>
                            <div className="risk-summary-card__level-row">
                                <span className={`risk-badge risk-badge--${risk.level}`}>
                                    {riskEmoji(risk.level)} {levelLabel(risk.level)} ({risk.probabilityRange})
                                </span>
                            </div>
                            <div className="risk-summary-card__trend-row">
                                <span className={`trend-arrow trend-arrow--${risk.trend}`}>
                                    {trendSymbol(risk.trend)}
                                </span>
                            </div>
                        </div>
                        <div className="risk-summary-card__delta">
                            <span>{t('risk.lastChange')}</span>
                            {/* risk.delta = clinical data */}
                            <strong>{risk.delta}</strong>
                        </div>
                    </div>
                    {expanded === i && (
                        <div className="risk-summary-card__details animate-in">
                            <p>{t('risk.detailText')}</p>
                            <div className="risk-summary-card__meta">
                                <span>{t('risk.horizon')} {risk.horizon}</span>
                                <span>{t('risk.confidence')}</span>
                                <span>{t('risk.model')}</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
