import React, { useState, useEffect } from 'react';
import Main1 from './pages/Main1';
import Main2 from './pages/Main2';
import Navbar from './components/Navbar';
import Login from 'features/auth/Login';
import Logout from 'features/auth/Logout';
import SignUp from 'features/auth/SignUp';
import FindAccount from 'features/auth/FindAccount';
import Notice from './pages/Notice';
import MemberManagement from 'features/auth/MemberManagement';
import XRayUpload from './pages/XRayUpload';
import Profile from 'features/auth/Profile';
import DiagnosisList from './pages/DiagnosisList';
import UploadHistory from './pages/UploadHistory';
import Diagnosis from 'features/diagnosis/Diagnosis';
import { AuthProvider } from "app/providers";
import ResetPassword from 'features/auth/ResetPassword';
//import BaseLayout from "./components/layout/BaseLayout";
//import ProtectedRoute from "./components/layout/ProtectedRoute"; // 로그인 보호된 라우트

function App() {
    const [currentPage, setCurrentPage] = useState('main');
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedXrayId, setSelectedXrayId] = useState(null);
    const [selectedNotice, setSelectedNotice] = useState(null);


    // 새로고침 시 localStorage에서 사용자 정보 복원
    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("memberName");
        const storedRoleCd = localStorage.getItem("roleCd");
        const storedEmail = localStorage.getItem("email");
        const isLogin = localStorage.getItem("isLogin");
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (token) {
            // reset-password 페이지로 이동하고 token 전달
            setCurrentPage('reset-password');
        }
        
        if (isLogin && storedUserId && storedUserName && storedRoleCd) {
            setCurrentUser({
                memberId: storedUserId,
                memberName: storedUserName,
                role: storedRoleCd,
                email: storedEmail,
            });
        }
    }, []); // 첫 렌더링 시 한 번만 실행

    const handleLogin = (userData) => {
        setCurrentUser(userData);
        setCurrentPage('main');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('main');
    };

    const handleNavigate = (page, payload) => {
        setCurrentPage(page);
        if (payload && payload.xrayId) {
            setSelectedXrayId(payload.xrayId);
        }
        if (payload && payload.notice) {
            setSelectedNotice(payload.notice);
        } else {
            setSelectedNotice(null);
        }
    };

    const renderPage = () => {
        // --- 1. 비로그인 상태에서 보여줄 페이지 ---
        if (!currentUser) {

            switch (currentPage) {
                case 'login':
                    return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
                case 'signup':
                    return <SignUp onNavigate={handleNavigate} />;
                case 'find-account':
                    return <FindAccount onNavigate={handleNavigate} />;
                case 'reset-password':
                    return <ResetPassword onNavigate={handleNavigate} />;  // ✅ 추가                    
                case 'main':
                default:
                    return <Main1 />;
            }
        }

        // --- 2. 로그인 상태에서 보여줄 페이지 ---  2025.10.22 jaemin role code 변경
        switch (currentPage) {
            case 'logout':
                return <Logout onNavigate={handleNavigate} onLogout={handleLogout} />;
            case 'notice':
                return <Notice currentUser={currentUser} initialNotice={selectedNotice} />;
            case 'profile':
                return <Profile currentUser={currentUser} setCurrentUser={setCurrentUser} />;
            case 'members':
                return currentUser.role === 'A' ? <MemberManagement /> : <h2 className="text-center">접근 권한이 없습니다.</h2>;
            case 'diagnosis':
                return <XRayUpload currentUser={currentUser} />;
            case 'view-diagnosis':
                return <Diagnosis xrayId={selectedXrayId} currentUser={currentUser} onNavigate={handleNavigate} />;
            case 'diagnosis-list':
                return currentUser.role === 'D' || currentUser.role === 'A' ? <DiagnosisList currentUser={currentUser} onNavigate={handleNavigate} /> : <h2 className="text-center">접근 권한이 없습니다.</h2>;
            case 'xray-upload':
                 return currentUser.role === 'X' ? <XRayUpload currentUser={currentUser} onNavigate={handleNavigate} /> : <h2 className="text-center">접근 권한이 없습니다.</h2>;
            case 'upload-history':
                 return currentUser.role === 'X' || currentUser.role === 'A' ? <UploadHistory currentUser={currentUser} /> : <h2 className="text-center">접근 권한이 없습니다.</h2>;
            case 'main':
            default:
                return <Main2 currentUser={currentUser} onNavigate={handleNavigate} />;
        }
    };

    return (
        <AuthProvider>
            <div className="bg-gray-900 text-white min-h-screen font-sans">
                <Navbar 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    onNavigate={handleNavigate} 
                />
                <main className="container mx-auto p-4 sm:p-6 md:p-8 pt-24">
                    {renderPage()}
                </main>
            </div>
        </AuthProvider>
    );
}

export default App;
