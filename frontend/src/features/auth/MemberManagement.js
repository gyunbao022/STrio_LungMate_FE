import React, { useState, useEffect } from 'react';
import instance from "services/api/client";
import styles from '../../styles/features/auth/MemberManagement.module.css';

function MemberManagement() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editedRole, setEditedRole] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const ROLE_MAP = {
        D: 'DOCTOR',
        X: 'XRAY_OPERATOR',
        A: 'ADMIN',
    };    
    
    const getMemberList = async () => {
        console.log("member list =>");
        await instance
        .get(`/member/list`)
        .then((response) => {
            setMembers(response.data.merberList);
        })
        .catch((error) => {
            console.log("member list:", error.message);
        });
    };
    
    useEffect(() => {
        getMemberList();
        setLoading(false);
    }, []);

    const filteredMembers = members.filter(member =>
        member.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (member) => {
        setEditingMemberId(member.userId);
        setEditedRole(member.roleCd);        
    };

    const handleSaveClick = async (memberId) => {
        if (!editedRole) {
            alert("수정할 역할을 선택해주세요.");
            return;
        }

        try {
            const response = await instance.put("/member/updateRole", {
                userId: memberId,
                roleCd: editedRole,
            });

            if (response.status === 200) {
                alert(`${memberId}의 권한이 ${editedRole}로 변경되었습니다.`);
                await getMemberList();
                setEditingMemberId(null);
            }
        } catch (error) {
            console.error("회원 수정 실패:", error);
            alert("권한 수정 실패: " + (error.response?.data?.message || error.message));
        }
    };

    const handleCancelClick = () => {
        setEditingMemberId(null);
    };

    const handleDeleteClick = async (memberId) => {
        if (!window.confirm(`${memberId} 회원을 정말로 삭제하시겠습니까?`)) return;

        try {
            const response = await instance({
                method: "delete",
                url: `/member/delete/${encodeURIComponent(memberId)}`,
            });

            if (response.status === 200) {
                alert(`${memberId} 회원이 삭제되었습니다.`);
                getMemberList();
            }
        } catch (error) {
            console.error("삭제 요청 실패:", error);
            alert("삭제 실패: " + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <div>로딩 중...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>회원 관리</h1>
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="아이디 또는 이름으로 검색..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                        <tr>
                            <th className={styles.tableHeaderCell}>아이디</th>
                            <th className={styles.tableHeaderCell}>이름</th>
                            <th className={styles.tableHeaderCell}>역할(Role)</th>
                            <th className={styles.tableHeaderCell}>가입일</th>
                            <th className={styles.tableHeaderCellCenter}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map(member => (
                            <tr key={member.userId} className={styles.tableRow}>
                                <td className={styles.tableCell}>{member.userId}</td>
                                <td className={styles.tableCell}>{member.userName}</td>
                                <td className={styles.tableCell}>
                                    {editingMemberId === member.userId ? (
                                        <select value={editedRole} onChange={(e) => setEditedRole(e.target.value)} className={styles.roleSelect}>
                                            <option value="D">DOCTOR</option>
                                            <option value="X">XRAY_OPERATOR</option>
                                            <option value="A">ADMIN</option>
                                        </select>
                                    ) : (
                                        ROLE_MAP[member.roleCd] || member.roleCd
                                    )}
                                </td>
                                <td className={styles.tableCell}>{formatDate(member.createdAt)}</td>
                                <td className={styles.tableCellCenter}>
                                    {editingMemberId === member.userId ? (
                                        <>
                                            <button onClick={() => handleSaveClick(member.userId)} className={`${styles.actionButton} ${styles.actionButtonSave}`}>저장</button>
                                            <button onClick={handleCancelClick} className={`${styles.actionButton} ${styles.actionButtonCancel}`}>취소</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEditClick(member)} className={`${styles.actionButton} ${styles.actionButtonEdit}`}>수정</button>
                                            <button onClick={() => handleDeleteClick(member.userId)} className={`${styles.actionButton} ${styles.actionButtonDelete}`}>삭제</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MemberManagement;
