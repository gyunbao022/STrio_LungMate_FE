import React from 'react';
import styles from '../styles/components/AuthLayout.module.css';

// title: "로그인", "회원가입" 등 페이지 제목을 받습니다.
// children: 이 컴포넌트가 감싸는 내부 요소들(폼, 버튼 등)을 의미합니다.
function AuthLayout({ title, children }) {
    return (
        <div className={styles.authContainer}>
            <h2 className={styles.authTitle}>{title}</h2>
            {children} {/* 이 부분에 각 페이지의 고유한 내용이 들어옵니다. */}
        </div>
    );
}

export default AuthLayout;