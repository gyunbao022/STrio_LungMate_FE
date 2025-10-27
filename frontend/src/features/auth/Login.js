import React, { useState } from 'react';
import AuthLayout from '../../components/AuthLayout';
import instance from "services/api/client";
import { useAuth } from "../../components/AuthProvider";
import styles from '../../styles/features/auth/Auth.module.css';

function Login({ onLogin, onNavigate }) {
    const [error, setError] = useState('');
    
    const [inputs, setInputs] = useState({
        userId: "",
        passwd: "",
    });
    
    const handleValueChange = (e) => {
        setInputs((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
        }));
    };
  
    const { userId, passwd } = inputs;
    const { login } = useAuth();    

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            await instance
                .post(`/login`, inputs)
                .then((response) => {
                console.log(response);

                //응답 헤더에서 토큰 추출
                const accessToken = response.headers["authorization"];
                const refreshToken = response.headers["authorization-refresh"];

                console.log("accessToken => ", accessToken);
                console.log("refreshToken => ", refreshToken);

                localStorage.setItem("Authorization", accessToken);
                localStorage.setItem("Authorization-refresh", refreshToken);

                localStorage.setItem("userId", response.data.userId);
                localStorage.setItem("userName", response.data.userName);
                localStorage.setItem("roleCd", response.data.roleCd);
                localStorage.setItem("email", response.data.email);
                localStorage.setItem("isLogin", true);
                return response;
                })
                .then((response) => {
                    login();
                    setInputs({ userId: "", passwd: "" });
                    const userData = {
                        memberId: response.data.userId,
                        memberName: response.data.userName,
                        role: response.data.roleCd,
                        email: response.data.email,
                    };                    
                    onLogin(userData);
                })
                .catch((error) => {
                      if (error.response && error.response.status === 401) {
                          setError("아이디 또는 비밀번호가 일치하지 않습니다.");
                      } else {
                          setError("로그인 중 오류가 발생했습니다.");
                      }
                });
        } catch (err) {
            alert("로그인 실패2 : 아이디 또는 비밀번호 확인");
        }
    };    

    return (
        <AuthLayout title="로그인">
            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className={styles.formLabel}>아이디</label>
                    <input
                        id="username"
                        type="text"
                        name="userId"
                        className={styles.formInput}
                        value={userId}
                        onChange={handleValueChange}
                    />
                </div>
                <div>
                    <label htmlFor="password" className={styles.formLabel}>비밀번호</label>
                    <input
                        id="password"
                        type="password"
                        name="passwd"
                        className={styles.formInput}
                        value={passwd}
                        onChange={handleValueChange}
                    />
                </div>
                {error && <p className={styles.errorMessage}>{error}</p>}
                
                <button type="submit" className={styles.btnPrimary}>
                    로그인
                </button>
            </form>

            <div className="text-center mt-6">
                <button 
                    onClick={() => onNavigate('signup')} 
                    className={styles.linkPrimary}
                >
                    회원가입
                </button>
                <span className={styles.divider}>|</span>
                <button 
                    onClick={() => onNavigate('find-account')} 
                    className={styles.linkPrimary}
                >
                    아이디/비밀번호 찾기
                </button>
            </div>
        </AuthLayout>
    );
}

export default Login;
