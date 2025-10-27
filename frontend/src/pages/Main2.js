import React, { useState, useEffect } from 'react';
import api from '../token/interceptors';
import styles from '../styles/pages/Main2.module.css';

function Main2({ currentUser, onNavigate }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchNotices = async () => {
            setLoading(true);
            try {
                const response = await api.get('/notice/list/1');
                setNotices((response.data.noticeList || []).slice(0, 5));
            } catch (error) {
                console.error("공지사항 로딩에 실패했습니다:", error);
                setNotices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();
    }, []);

    return (
        <div className={styles.container}>
            {currentUser ? (
                <h2 className={styles.title}>'{currentUser.memberName}'님, 환영합니다.</h2>
            ) : (
                <h2 className={styles.title}>LungMate에 오신 것을 환영합니다.</h2>
            )}
            
            <div className={styles.content}>
                
                {/* 이미지와 공지사항을 위한 플렉스 컨테이너 */}
                <div className={styles.flexContainer}>
                    
                    {/* 왼쪽: 이미지 */}
                    <div className={styles.imageSection}>
                        <img 
                            src={require('../images/Main_image1.jpg')} 
                            alt="Doctor examining X-ray" 
                            className={styles.image}
                        />
                    </div>

                    {/* 오른쪽: 공지사항 미리보기 */}
                    <div className={styles.noticeSection}>
                        <div className={styles.noticeHeader}>
                            <h3 className={styles.noticeTitle}>최신 공지사항</h3>
                            <button onClick={() => onNavigate('notice')} className={styles.noticeMoreButton}>더보기</button>
                        </div>
                        <div className={styles.noticeContent}>
                            {loading ? (
                                <p className={styles.noticeLoading}>공지사항을 불러오는 중입니다...</p>
                            ) : notices.length > 0 ? (
                                <ul className={styles.noticeList}>
                                    {notices.map(notice => (
                                        <li key={notice.noticeId} className={styles.noticeItem}>
                                            <button onClick={() => onNavigate('notice', { notice: notice })}
                                             className={styles.noticeButton}
                                              title={notice.title}>
                                                {notice.title}
                                            </button>
                                            <span className={styles.noticeDate}>
                                                {new Date(notice.createdAt).toLocaleDateString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noticeEmpty}>등록된 공지사항이 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* About LungMate 섹션 */}
                <div className={styles.infoBox}>
                    <h3 className={styles.infoTitle}>About LungMate</h3>
                    <p className={styles.infoText}>
                        LungMate는 흉부 X-ray 이미지를 통해 폐렴을 진단하는 데 도움을 주는 AI 기반 서비스입니다. 
                        <br />
                        이미지를 업로드하고 몇 초 안에 예비 진단을 받아보세요.
                    </p>
                </div>

            </div>

            <p className={styles.footer}>메뉴를 선택하여 진단을 시작하세요.</p>
        </div>
    );
}

export default Main2;