import React from 'react';
import styles from '../styles/pages/Main1.module.css';

function Main1() {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>LungMate에 오신 것을 환영합니다.</h2>
            
            <div className={styles.content}>
                <img 
                    src={require('../images/Main_image1.jpg')} 
                    alt="Doctor examining X-ray" 
                    className={styles.image}
                />
                <div className={styles.infoBox}>
                    <h3 className={styles.infoTitle}>About LungMate</h3>
                    <p className={styles.infoText}>
                        LungMate는 흉부 X-ray 이미지를 통해 폐렴을 진단하는 데 도움을 주는 AI 기반 서비스입니다. 
                        <br />
                        이미지를 업로드하고 몇 초 안에 예비 진단을 받아보세요.
                    </p>
                </div>
            </div>

            <p className={styles.footer}>로그인하여 진단을 시작하세요.</p>
        </div>
    );
}

export default Main1;
