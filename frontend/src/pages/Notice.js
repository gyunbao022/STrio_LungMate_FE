import React, { useState, useEffect, useCallback } from 'react';
import api from '../token/interceptors';
import styles from '../styles/pages/Notice.module.css';

function Notice({ currentUser, initialNotice }) {
    const [selectedNotice, setSelectedNotice] = useState(initialNotice || null);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedNotice, setEditedNotice] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // 1. fetchNotices (useCallback 유지 - 올바른 코드)
    const fetchNotices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/notice/list/1');
            const sortedNotices = response.data.noticeList.sort((a, b) => b.noticeId - a.noticeId);
            setNotices(sortedNotices);
        } catch (error) {
            console.error("공지사항을 불러오는 중 오류가 발생했습니다:", error);
            alert("공지사항을 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []); 

    // 2. useEffect (useCallback 의존성 유지)
    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]); 

    useEffect(() => {
        setSelectedNotice(initialNotice || null);
    }, [initialNotice]);

    // 실제 사용자 권한 체크 (role === 'A'는 관리자)
    const isAdmin = currentUser && currentUser.role === 'A';

    // 4. handleCreate, handleEdit (유지)
    const handleCreate = () => {
        setEditedNotice({ title: '', cont: '' });
        setIsEditing(true);
        setSelectedNotice(null);
    };

    const handleEdit = (notice) => {
        setEditedNotice({ ...notice });
        setIsEditing(true);
        setSelectedNotice(null);
    };

    // 5. handleDelete (유지 - 올바른 코드)
    const handleDelete = async (noticeId) => {
        if (window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) {
            setIsSaving(true); 
            try {
                await api.delete(`/notice/delete/${noticeId}`);
                alert("공지사항이 삭제되었습니다.");
                setSelectedNotice(null);
                await fetchNotices(); // 목록 새로고침
            } catch (error) {
                console.error("공지사항 삭제 중 오류:", error);
                alert("삭제 중 오류가 발생했습니다.");
            } finally {
                setIsSaving(false); 
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true); 

        // 디버깅: 현재 사용자 정보 확인
        console.log("=== 공지사항 저장 시작 ===");
        console.log("currentUser:", currentUser);
        console.log("localStorage userId:", localStorage.getItem("userId"));
        console.log("localStorage userName:", localStorage.getItem("userName"));
        console.log("localStorage memberName:", localStorage.getItem("memberName"));
        console.log("localStorage roleCd:", localStorage.getItem("roleCd"));
        console.log("localStorage Authorization:", localStorage.getItem("Authorization"));

    const isNew = !editedNotice.noticeId;
        
        // 로그인된 사용자 ID 확인
        if (!currentUser) {
            console.error("currentUser가 없습니다!");
            alert("로그인 정보가 없어 저장할 수 없습니다. 다시 로그인해주세요.");
            setIsSaving(false);
            return;
        }

        // 백엔드는 멀티파트 폼 데이터로 바인딩합니다.
        // 따라서 FormData를 사용하여 전송해야 합니다.
        const formData = new FormData();
        formData.append('title', editedNotice.title ?? '');
        formData.append('cont', editedNotice.cont ?? '');
        // 파일 업로드 입력이 있다면 아래처럼 추가 (현재 UI에는 파일 입력 없음)
        // if (editedNotice.file) formData.append('filename', editedNotice.file);

        if (!isNew) {
            formData.append('noticeId', editedNotice.noticeId);
        }
        
        console.log("전송할 데이터 (FormData): title=", editedNotice.title, ", cont=", editedNotice.cont, ", noticeId=", editedNotice.noticeId);

        try {
            if (isNew) {
                console.log("새 공지사항 작성 API 호출...");
                const response = await api.post('/notice/write', formData);
                console.log("작성 성공:", response.data);
                alert('공지사항이 성공적으로 작성되었습니다.');
            } else {
                console.log("공지사항 수정 API 호출...");
                const response = await api.put('/notice/update', formData);
                console.log("수정 성공:", response.data);
                alert('공지사항이 성공적으로 수정되었습니다.');
            }

            setIsEditing(false);
            setEditedNotice(null);
            setSelectedNotice(null);
            await fetchNotices(); // 목록 새로고침

        } catch (error) {
            console.error("=== 공지사항 저장 실패 ===");
            console.error("에러 객체:", error);
            console.error("에러 응답:", error.response);
            console.error("에러 요청:", error.request);
            console.error("에러 메시지:", error.message);
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                console.error("HTTP 상태 코드:", status);
                console.error("응답 데이터:", data);
                console.error("응답 헤더:", error.response.headers);
                
                if (status === 403) {
                    alert(`저장 권한이 없습니다.\n\n현재 역할: ${currentUser?.role}\n필요 역할: 관리자(A)\n\n관리자 계정으로 로그인해주세요.`);
                } else if (status === 401) {
                    alert("인증이 만료되었습니다. 다시 로그인해주세요.");
                    // 토큰 제거 및 로그인 페이지로 이동 권장
                } else if (status === 500) {
                    const errorMsg = typeof data === 'string' ? data : data.message || '알 수 없는 오류';
                    alert(`서버 내부 오류가 발생했습니다.\n\n오류 내용: ${errorMsg}\n\n백엔드 로그를 확인해주세요.`);
                } else if (status === 400) {
                    const errorMsg = typeof data === 'string' ? data : data.message || '입력값을 확인해주세요.';
                    alert(`잘못된 요청입니다.\n\n오류 내용: ${errorMsg}`);
                } else {
                    const errorMsg = typeof data === 'string' ? data : data.message || '';
                    alert(`저장 중 오류가 발생했습니다. (${status})\n${errorMsg}`);
                }
            } else if (error.request) {
                console.error("요청이 전송되었으나 응답을 받지 못함");
                alert("서버와 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
            } else {
                console.error("요청 설정 중 오류 발생");
                alert("저장 중 오류가 발생했습니다.");
            }
        } finally {
            setIsSaving(false);
            console.log("=== 공지사항 저장 종료 ===");
        }
    };

    if (loading) {
        return <div className={styles.loadingText}>로딩 중...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>공지사항</h1>
                {isAdmin && !isEditing && (
                    <button onClick={handleCreate} className={styles.createButton}>
                        글쓰기
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSave} className={styles.editForm}>
                    <input 
                        type="text" 
                        value={editedNotice.title}
                        onChange={(e) => setEditedNotice({ ...editedNotice, title: e.target.value })}
                        placeholder="제목" 
                        className={styles.formInput}
                        required 
                        disabled={isSaving} 
                    />
                    <textarea 
                        value={editedNotice.cont}
                        onChange={(e) => setEditedNotice({ ...editedNotice, cont: e.target.value })}
                        placeholder="내용" 
                        className={styles.formTextarea}
                        required 
                        disabled={isSaving} 
                    />
                    <div className={styles.formActions}>
                        <button type="button" onClick={() => setIsEditing(false)}
                            className={styles.formCancelButton}
                            disabled={isSaving}> 
                            취소
                        </button>
                        <button type="submit"
                            className={styles.formSaveButton}
                            disabled={isSaving}>
                            {isSaving ? '저장 중...' : '저장'} 
                        </button>
                    </div>
                </form>
            ) : selectedNotice ? (
                <div className={styles.detailContainer}>
                    <h2 className={styles.detailTitle}>{selectedNotice.title}</h2>
                    <p className={styles.detailMeta}>
                        작성일: {new Date(selectedNotice.createdAt).toLocaleDateString()}
                    </p>
                    <div className={styles.detailContent}>
                        {selectedNotice.cont}
                    </div>
                    <div className={styles.detailActions}>
                        <button onClick={() => setSelectedNotice(null)}
                            className={styles.backButton}>
                            목록으로
                        </button>
                        {isAdmin && (
                            <div className={styles.adminActions}>
                                <button onClick={() => handleEdit(selectedNotice)}
                                    className={styles.editButton}>
                                    수정
                                </button>
                                <button onClick={() => handleDelete(selectedNotice.noticeId)}
                                    className={styles.deleteButton}
                                    disabled={isSaving}> 
                                    {isSaving ? '삭제 중...' : '삭제'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th scope="col">번호</th>
                                <th scope="col">제목</th>
                                <th scope="col">작성일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notices.map(notice => (
                                <tr key={notice.noticeId} className={styles.tableRow}>
                                    <td>{notice.noticeId}</td>
                                    <td>
                                        <button onClick={() => setSelectedNotice(notice)} className={styles.tableButton}>
                                            {notice.title}
                                        </button>
                                    </td>
                                    <td>{new Date(notice.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Notice;