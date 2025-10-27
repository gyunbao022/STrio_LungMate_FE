import React, { useState } from 'react';
import AuthLayout from '../../components/AuthLayout';
import styles from '../../styles/features/auth/Auth.module.css';
import instance from "../../token/interceptors";

function FindAccount({ onNavigate }) {
    const [activeTab, setActiveTab] = useState('id');
    const [successMessage, setSuccessMessage] = useState(''); // ✅ 성공 메시지 상태 추가
    const [error, setError] = useState('');
    const [members, setMembers] = useState({
        userId: "",
        userName: "",
        email: "",
    }); 

    const handleValueChange = (e) => {
        setMembers((prev) => {
        return { ...prev, [e.target.name]: e.target.value };
        });
    };       

    const maskUserId = (userId) => {
        if (!userId) return "";

        // 문자열 길이가 4 미만인 경우 예외 처리
        if (userId.length < 4) return userId;

        // 앞 2글자 + '**' + 5번째 이후
        return userId.substring(0, 2) + "**" + userId.substring(4);
    };

    const handleFindId = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setError('');

        await instance
        .post(`/member/findId`, members)
        .then((response) => {
            console.log(response.data);      
            const maskedId = maskUserId(response.data.userId);
            setSuccessMessage(`회원아이디는 ${maskedId} 입니다.`);

        })
        .catch((error) => {
            console.log("signup 오류:", error.message);
            setError("회원정보가 정확하지 않습니다.");
        });
    };

    const handleFindPassword = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setError('');

        await instance
        .post(`/member/findPasswd`, members)
        .then((response) => {
            console.log(response.data);            
            setSuccessMessage(`회원님 메일로 링크정보가 발송되었습니다.`);
        })
        .catch((error) => {
            console.log("signup 오류:", error.message);
            setError("회원정보가 정확하지 않습니다.");
        });    
    };

    const resetForm = () => {
        setMembers({ userId: "", userName: "", email: "" });
        setError('');
        setSuccessMessage('');
    };    

    return (
        <AuthLayout title="계정 찾기">
            <div className="flex border-b border-gray-600 mb-6">
                <button 
                    onClick={() => { setActiveTab('id'); resetForm(); }} 
                    className={`flex-1 py-2 text-center transition-colors duration-200 ${activeTab === 'id' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    아이디 찾기
                </button>
                <button 
                    onClick={() => { setActiveTab('pw'); resetForm(); }} 
                    className={`flex-1 py-2 text-center transition-colors duration-200 ${activeTab === 'pw' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    비밀번호 찾기
                </button>
            </div>

            {activeTab === 'id' ? (
                <form onSubmit={handleFindId} className="space-y-6">
                    <input placeholder="이름" name="userName" value={members.userName} onChange={handleValueChange} className={styles.formInput}/>
                    <input type="email" placeholder="이메일" name="email" value={members.email} onChange={handleValueChange} className={styles.formInput}/>
                    <button type="submit" className={styles.btnPrimary}>아이디 찾기</button>
                </form>
            ) : (
                <form onSubmit={handleFindPassword} className="space-y-6">
                    <input placeholder="아이디" name="userId" value={members.userId} onChange={handleValueChange} className={styles.formInput}/>
                    <input type="email" placeholder="이메일" name="email" value={members.email} onChange={handleValueChange} className={styles.formInput}/>
                    <button type="submit" className={styles.btnPrimary}>비밀번호 재설정 링크 보내기</button>
                </form>
            )}
            {error && <p className="text-red-400 text-center text-sm pt-2">{error}</p>}
            {successMessage && <p className="text-green-400 text-center text-sm mb-4">{successMessage}</p>}

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
