import { useState } from 'react';
import type { SimilarCase } from '../data/types';

export default function SimilarCases({ cases }: { cases: SimilarCase[] }) {
    const [selectedCase, setSelectedCase] = useState<SimilarCase | null>(null);

    return (
        <>
            <div className="similar-cases-grid">
                {cases.map((sc, i) => (
                    <div
                        key={sc.id}
                        className={`similar-case-card glass-card animate-in animate-in-delay-${Math.min(i + 1, 5)}`}
                        style={{ opacity: 0 }}
                        onClick={() => setSelectedCase(sc)}
                    >
                        <div className="similar-case-card__header">
                            <span className="similar-case-card__ga">{sc.ga}w / {sc.bw}g</span>
                            <span className="similar-case-card__score">{sc.similarityScore}%</span>
                        </div>
                        <div className="similar-case-card__score-bar">
                            <div className="similar-case-card__score-fill" style={{ width: `${sc.similarityScore}%` }} />
                        </div>
                        <p className="similar-case-card__issue">{sc.mainIssue}</p>
                        <p className="similar-case-card__outcome">{sc.outcomeSummary}</p>
                        <div className="similar-case-card__time">
                            <span>⏱️ {sc.timeToEvent}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedCase && (
                <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Case Details</h3>
                            <button className="modal-close" onClick={() => setSelectedCase(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-stats">
                                <div className="modal-stat">
                                    <span className="modal-stat__label">GA</span>
                                    <span className="modal-stat__value">{selectedCase.ga}w</span>
                                </div>
                                <div className="modal-stat">
                                    <span className="modal-stat__label">BW</span>
                                    <span className="modal-stat__value">{selectedCase.bw}g</span>
                                </div>
                                <div className="modal-stat">
                                    <span className="modal-stat__label">Similarity</span>
                                    <span className="modal-stat__value">{selectedCase.similarityScore}%</span>
                                </div>
                            </div>
                            <h4>{selectedCase.mainIssue}</h4>
                            <p className="modal-detail-text">{selectedCase.details}</p>
                            <div className="modal-outcome">
                                <span className="modal-outcome__label">Outcome</span>
                                <p>{selectedCase.outcomeSummary}</p>
                            </div>
                            <div className="modal-time">
                                <span>⏱️ {selectedCase.timeToEvent}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
