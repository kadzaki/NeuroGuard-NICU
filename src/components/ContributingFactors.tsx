import { useState } from 'react';
import type { ContributingFactor, TrendDirection } from '../data/types';
import { useI18n } from '../i18n';

function trendIcon(trend: TrendDirection) {
    if (trend === 'increasing') return '↑';
    if (trend === 'decreasing') return '↓';
    return '→';
}

export default function ContributingFactors({ factors }: { factors: ContributingFactor[] }) {
    const { t } = useI18n();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="contributing-factors">
            {factors.map((factor, i) => (
                <div
                    key={factor.id}
                    className={`factor-item glass-card animate-in animate-in-delay-${Math.min(i + 1, 5)}`}
                    style={{ opacity: 0 }}
                >
                    <div
                        className="factor-item__header"
                        onClick={() => setExpandedId(expandedId === factor.id ? null : factor.id)}
                    >
                        <div className="factor-item__main">
                            <span className={`factor-item__trend trend-arrow trend-arrow--${factor.trend}`}>
                                {trendIcon(factor.trend)}
                            </span>
                            {/* factor.text = clinical data, stays in original language */}
                            <span className="factor-item__text">{factor.text}</span>
                        </div>
                        <span className="factor-item__chevron">{expandedId === factor.id ? '▾' : '▸'}</span>
                    </div>
                    {expandedId === factor.id && (
                        <div className="factor-item__details animate-in">
                            <div className="factor-detail">
                                <span className="factor-detail__label">{t('factors.data')}</span>
                                {/* clinical data */}
                                <p>{factor.dataSnippet}</p>
                            </div>
                            {factor.noteExcerpt && (
                                <div className="factor-detail">
                                    <span className="factor-detail__label">{t('factors.clinicalNote')}</span>
                                    <p className="factor-detail__note">{factor.noteExcerpt}</p>
                                </div>
                            )}
                            <div className="factor-detail">
                                <span className="factor-detail__label">{t('factors.similarCases')}</span>
                                <p>{factor.similarCaseSummary}</p>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
