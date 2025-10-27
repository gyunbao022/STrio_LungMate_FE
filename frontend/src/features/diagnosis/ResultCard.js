import React from 'react';
import styles from '../../styles/features/diagnosis/ResultCard.module.css';

function ResultCard({ analysisResult, summaryResult, onGenerateSummary, isSummaryLoading }) {
    if (!analysisResult) {
        return (
            <div className={styles.resultContainerFull}>
                <div className={styles.resultPlaceholder}>
                    <svg className={styles.resultPlaceholderIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5l4 4v10a2 2 0 01-2 2z"></path></svg>
                    <h3 className={styles.resultPlaceholderTitle}>분석 대기 중</h3>
                    <p className={styles.resultPlaceholderText}>이미지를 업로드하고 분석을 시작하세요.</p>
                </div>
            </div>
        );
    }
    
    const { isPneumonia, confidence } = analysisResult;
    const resultString = isPneumonia ? "폐렴 의심" : "정상";
    const confidencePercent = (confidence * 100).toFixed(1);

    return (
        <div className={styles.resultContainer}>
            <h2 className={styles.resultTitle}>2. AI 분석 결과</h2>
            <div className={`${styles.resultBox} ${isPneumonia ? styles.resultBoxAbnormal : styles.resultBoxNormal}`}>
                <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>진단 결과:</span>
                    <span className={`${styles.resultBadge} ${isPneumonia ? styles.resultBadgeAbnormal : styles.resultBadgeNormal}`}>{resultString}</span>
                </div>
                <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>신뢰도:</span>
                    <span className={styles.resultValue}>{confidencePercent}%</span>
                </div>
            </div>
            
            <button 
                onClick={onGenerateSummary}
                disabled={isSummaryLoading}
                className={styles.summaryButton}
            >
                {isSummaryLoading ? (
                    <>
                        <svg className={styles.summarySpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className={styles.summarySpinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className={styles.summarySpinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        생성 중...
                    </>
                ) : '✨ AI 소견 요약 생성'}
            </button>

            {summaryResult && (
                 <div className={styles.summaryContent}>
                    <h3 className={styles.summaryTitle}>AI 소견 요약</h3>
                    <div className={styles.summaryText}>{summaryResult}</div>
                </div>
            )}
        </div>
    );
}

export default ResultCard;
