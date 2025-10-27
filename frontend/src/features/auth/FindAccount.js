import React, { useState } from 'react';
import AuthLayout from '../../components/AuthLayout';
import styles from '../../styles/features/auth/Auth.module.css';

function FindAccount({ onNavigate }) {
    const [activeTab, setActiveTab] = useState('id');

    const handleFindId = async (e) => {
        e.preventDefault();
        alert("아이디 찾기 API가 호출되었습니다.");
    };

    const handleFindPassword = async (e) => {
        e.preventDefault();
        alert("비밀번호 찾기 API가 호출되었습니다.");
    };

    return (
        <AuthLayout title="계정 찾기">
            <div className="flex border-b border-gray-600 mb-6">
                <button 
                    onClick={() => setActiveTab('id')} 
                    className={`flex-1 py-2 text-center transition-colors duration-200 ${activeTab === 'id' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    아이디 찾기
                </button>
                <button 
                    onClick={() => setActiveTab('pw')} 
                    className={`flex-1 py-2 text-center transition-colors duration-200 ${activeTab === 'pw' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    비밀번호 찾기
                </button>
            </div>

            {activeTab === 'id' ? (
                <form onSubmit={handleFindId} className="space-y-6">
                    <input placeholder="이름" className={styles.formInput}/>
                    <input type="email" placeholder="이메일" className={styles.formInput}/>
                    <button type="submit" className={styles.btnPrimary}>아이디 찾기</button>
                </form>
            ) : (
                <form onSubmit={handleFindPassword} className="space-y-6">
                    <input placeholder="아이디" className={styles.formInput}/>
                    <input type="email" placeholder="이메일" className={styles.formInput}/>
                    <button type="submit" className={styles.btnPrimary}>비밀번호 재설정 링크 보내기</button>
                </form>
            )}

            <div className="text-center mt-6">
                <button 
                    onClick={() => onNavigate('login')} 
                    className={styles.linkPrimary}
                >
                    로그인 페이지로 돌아가기
                </button>
            </div>
        </AuthLayout>
    );
}

export default FindAccount;
