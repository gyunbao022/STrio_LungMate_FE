import React, { useState } from 'react';
import AuthLayout from '../../components/AuthLayout';
import instance from "services/api/client";
import styles from '../../styles/features/auth/Auth.module.css';

function SignUp({ onNavigate }) {
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // ✅ 성공 메시지 상태 추가
    
    const [members, setMembers] = useState({
        userId: "",
        passwd: "",
        userName: "",
        email: "",
    });    

    const handleValueChange = (e) => {
        setMembers((prev) => {
        return { ...prev, [e.target.name]: e.target.value };
        });
    };    

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!members.userId || !members.passwd || !members.userName || !members.email) {
            setError("모든 항목을 입력해주세요.");
            return;
        }
        if (members.userId.length < 4) { // 최소 길이 설정
            setError("아이디는 4자 이상이어야 합니다.");
            return;
        }           
        if (members.passwd.length < 4) { // 최소 길이 설정
            setError("비밀번호는 4자 이상이어야 합니다.");
            return;
        }        
        if (members.passwd !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        
        await instance
        .post(`/member/signup`, members)
        .then((response) => {
            console.log(response.data);
            // alert 대신 커스텀 메시지 표시
            setSuccessMessage("회원가입이 성공적으로 완료되었습니다!");
            setTimeout(() => {
                setSuccessMessage('');
                onNavigate('login');
            }, 2000); // 2초 후 로그인 화면 이동
        })
        .catch((error) => {
            console.log("signup 오류:", error.message);
        });
    };
    
    return (
        <AuthLayout title="회원가입">        
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className={styles.formLabel}>아이디</label>
                    <input type="text" name="userId" value={members.userId} onChange={handleValueChange} className={styles.formInput} />
                </div>
                <div>
                    <label className={styles.formLabel}>비밀번호</label>
                    <input type="password" name="passwd" value={members.passwd} onChange={handleValueChange} className={styles.formInput} />
                </div>
                <div>
                    <label className={styles.formLabel}>비밀번호 확인</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.formInput} />
                </div>
                <div>
                    <label className={styles.formLabel}>이름</label>
                    <input type="text" name="userName" value={members.userName} onChange={handleValueChange} className={styles.formInput} />
                </div>
                <div>
                    <label className={styles.formLabel}>이메일</label>
                    <input type="email" name="email" value={members.email} onChange={handleValueChange} className={styles.formInput} />
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
                
                <button type="submit" className={styles.btnSecondary}>
                    가입하기
                </button>
            </form>
            <div className="text-center mt-6">
                <button onClick={() => onNavigate('login')} className={styles.linkPrimary}>
                    이미 계정이 있으신가요? 로그인
                </button>
            </div>
        </AuthLayout>
    );
}

export default SignUp;
