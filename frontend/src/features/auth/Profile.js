import React, { useState, useEffect } from 'react';
import AuthLayout from '../../components/AuthLayout';
import instance from "services/api/client";
import styles from '../../styles/features/auth/Profile.module.css';

function Profile({ currentUser, setCurrentUser }) {
    const [memberName, setMemberName] = useState(currentUser?.memberName || '');
    const [email, setEmail] = useState(currentUser?.email || '');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (currentUser) {
            setMemberName(currentUser.memberName || '');
            setEmail(currentUser.email || '');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setError('');
        }
    }, [currentUser]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!memberName || !email) {
            setError("이름과 이메일을 모두 입력해주세요.");
            return;
        }

        const userData = {
            userId: currentUser.memberId,
            userName: memberName,
            email: email,
        };  
        
        await instance
        .put(`/member/update`, userData)
        .then((response) => {
            console.log(response.data);
            localStorage.setItem("userName", memberName);
            localStorage.setItem("email", email);            
            setCurrentUser({ ...currentUser, memberName, email });
            setSuccessMessage("회원 정보가 성공적으로 업데이트되었습니다.");            
        })
        .catch((error) => {
            console.log(" member update 오류:", error.message);
            setError("정보 수정시 에러가 발생하였습니다.");
        });        
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError("모든 비밀번호 필드를 입력해주세요.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("새 비밀번호가 일치하지 않습니다.");
            return;
        }
        if (newPassword.length < 4) {
            setError("새 비밀번호는 4자 이상이어야 합니다.");
            return;
        }
        if (currentPassword === newPassword) {
            setError("현재 비밀번호와 새 비밀번호가 동일합니다.");
            return;
        }

        try {
            const userData = {
                userId: currentUser.memberId,
                passwd: currentPassword,
                newPasswd: newPassword,
            };              
            await instance
            .put(`/member/updatePasswd`, userData)
            .then((response) => {
                console.log(response.data);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setSuccessMessage("비밀번호가 성공적으로 변경되었습니다.");         
            })
            .catch((error) => {
                console.log(" member update 오류:", error.message);
                setError("비밀번호 변경시 에러가 발생하였습니다.");
            });              
        } catch (err) {
            setError(err.message);
        }
    };

    if (!currentUser) {
        return <AuthLayout title="회원 정보">
            <p className="text-center text-red-400">로그인이 필요합니다.</p>
        </AuthLayout>;
    }

    return (
        <AuthLayout title="회원 정보">
            <div className={styles.profileContainer}>
                <div className={styles.profileCard}>
                    <h3 className={styles.profileCardHeader}>내 정보</h3>
                    <form onSubmit={handleProfileUpdate} className={styles.profileForm}>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>아이디</label>
                            <input type="text" value={currentUser.memberId} className={styles.profileInput} disabled />
                        </div>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>이름</label>
                            <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} className={styles.profileInput} />
                        </div>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>이메일</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.profileInput} />
                        </div>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>역할(Role)</label>
                            <input type="text" value={currentUser.role} className={styles.profileInput} disabled />
                        </div>
                        <button type="submit" className={styles.profileButton}>
                            정보 수정
                        </button>
                    </form>
                </div>

                {error && <p className={styles.messageError}>{error}</p>}
                {successMessage && <p className={styles.messageSuccess}>{successMessage}</p>}
                
                <div className={styles.profileCard}>
                    <h3 className={styles.profileCardHeader}>비밀번호 변경</h3>
                    <form onSubmit={handlePasswordUpdate} className={styles.profileForm}>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>현재 비밀번호</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={styles.profileInput} />
                        </div>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>새 비밀번호</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={styles.profileInput} />
                        </div>
                        <div className={styles.profileFormGroup}>
                            <label className={styles.profileLabel}>새 비밀번호 확인</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={styles.profileInput} />
                        </div>
                        <button type="submit" className={styles.profileButton}>
                            비밀번호 변경
                        </button>
                    </form>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Profile;
