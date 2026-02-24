import type { ClinicalInterpretation as ClinicalInterpretationType } from '../data/types';
import { useI18n } from '../i18n';

export default function ClinicalInterpretation({ data }: { data: ClinicalInterpretationType }) {
    const { t } = useI18n();

    return (
        <div className="clinical-interpretation">
            <div className="clinical-interpretation__summary glass-card">
                <div className="clinical-interpretation__badge">
                    <span className="clinical-interpretation__badge-icon">🤖</span>
                    <span>{t('interp.badge')}</span>
                </div>
                {/* data.summary = clinical data, stays in original language */}
                <blockquote className="clinical-interpretation__text">
                    {data.summary}
                </blockquote>
                <div className="clinical-interpretation__meta">
                    <span>{t('interp.model')}</span>
                    <span>{t('interp.confidence')}</span>
                    <span>{t('interp.generated')}</span>
                </div>
            </div>

            {data.uncertaintyFlags.length > 0 && (
                <div className="uncertainty-section">
                    <h4 className="uncertainty-section__title">{t('interp.uncertaintyTitle')}</h4>
                    <div className="uncertainty-flags">
                        {/* uncertainty flags = clinical data, stay in original language */}
                        {data.uncertaintyFlags.map((flag, i) => (
                            <div key={i} className="uncertainty-flag glass-card animate-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                                <span className="uncertainty-flag__icon">⚠️</span>
                                <span>{flag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
