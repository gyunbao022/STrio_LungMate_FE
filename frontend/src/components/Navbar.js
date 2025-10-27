import React from 'react';
import styles from '../styles/components/Navbar.module.css';

function Navbar({ currentUser, onNavigate, onLogout }) {
    
    const getMenuItems = (role) => {
        // 비로그인 사용자를 위한 메뉴
        const commonMenus = [
            { name: '메인', page: 'main' },
        ];

        // 로그인한 사용자일 경우
        if (currentUser) {
            // 로그인 사용자 공통 메뉴 (회원정보는 별도 위치로 이동)
            const loggedInUserMenus = [
                { name: '공지사항', page: 'notice' }
            ];
            // D:DOCTOR, X:XRAY_OPERATOR, A:ADMIN  2025.10.22 jaemin role code 변경
            switch (role) {
                case 'D':
                    return [ ...loggedInUserMenus, { name: '판독 리스트', page: 'diagnosis-list' }];
                case 'X':
                    return [ ...loggedInUserMenus, { name: 'X-Ray 업로드', page: 'diagnosis' },
                                                   { name: '업로드 내역', page: 'upload-history' }];
                case 'A':
                    return [
                        { name: '메인', page: 'main' },
                        { name: '공지사항', page: 'notice' },
                        { name: 'X-Ray 업로드', page: 'diagnosis' },
                        { name: '업로드 내역', page: 'upload-history' },
                        { name: '판독 리스트', page: 'diagnosis-list' },
                        { name: '회원 관리', page: 'members' }
                    ];
                default: // 일반 사용자
                    return loggedInUserMenus;
            }
        }
        
        // 로그인하지 않은 사용자는 공통 메뉴만 보입니다.
        return commonMenus;
    };

    const menuItems = getMenuItems(currentUser?.role);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                <div className={styles.navbarContent}>
                    <div className={styles.logo} onClick={() => onNavigate('main')}>
                        <i className={`fas fa-stethoscope ${styles.logoIcon}`}></i> LungMate
                    </div>

                    <div className={styles.menuContainer}>
                        {menuItems.map(item => (
                            <button 
                                key={item.page} 
                                onClick={() => onNavigate(item.page)} 
                                className={styles.menuButton}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>

                    <div className={styles.userSection}>
                        {currentUser ? (
                            // 로그인 했을 때 UI
                            <>
                                <span className={styles.userName}>{currentUser.memberName} ({currentUser.role})</span>
                                <button 
                                    onClick={() => onNavigate('profile')} 
                                    className={styles.profileButton}
                                >
                                    회원정보
                                </button>
                                <button
                                    onClick={() => onNavigate('logout')}
                                    className={styles.logoutButton}
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            // 로그인 안 했을 때 UI
                            <div className={styles.authButtons}>
                                <button onClick={() => onNavigate('login')} className={styles.loginButton}>
                                    로그인
                                </button>
                                <button onClick={() => onNavigate('signup')} className={styles.signupButton}>
                                    회원가입
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
