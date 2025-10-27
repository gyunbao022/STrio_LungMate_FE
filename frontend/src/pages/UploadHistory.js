import React, { useState } from 'react';
import styles from '../styles/pages/UploadHistory.module.css';

// 업로드 내역에 사용할 초기 예시 데이터입니다. (업로더 이름을 'xray유저'로 변경)
const initialUploadHistoryData = [
  {
    xrayId: '5012',
    patientId: '100023',
    uploader: 'xray유저', // 현재 로그인된 xray유저와 일치하도록 수정
    registrationDate: '2025-09-30',
    status: 'PENDING',
  },
  {
    xrayId: '5013',
    patientId: '100024',
    uploader: 'another_xray_user', // 다른 업로더
    registrationDate: '2025-09-30',
    status: 'PENDING',
  },
  {
    xrayId: '5014',
    patientId: '100025',
    uploader: 'xray유저', // 현재 로그인된 xray유저와 일치하도록 수정
    registrationDate: '2025-10-01',
    status: 'COMPLETED',
  },
];

// App.js로부터 currentUser를 props로 받습니다.
function UploadHistory({ currentUser }) {
  const [uploadHistory, setUploadHistory] = useState(initialUploadHistoryData);
  
  // 필터 상태 관리
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 등록일 필터 추가
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleDelete = (xrayIdToDelete) => {
    const updatedHistory = uploadHistory.filter(item => item.xrayId !== xrayIdToDelete);
    setUploadHistory(updatedHistory);
    console.log(`ID가 ${xrayIdToDelete}인 항목을 삭제했습니다.`);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className={styles.statusChipPending}>PENDING</span>;
      case 'COMPLETED':
        return <span className={styles.statusChipCompleted}>COMPLETED</span>;
      default:
        return <span className={styles.statusChipDefault}>{status}</span>;
    }
  };

  const getStatusButtonClass = (filterName) => {
    return statusFilter === filterName ? styles.statusButtonActive : styles.statusButtonInactive;
  };

  // 현재 사용자의 역할에 따라 초기 데이터를 필터링합니다.
  const userFilteredHistory = currentUser && currentUser.role === 'XRAY_OPERATOR'
    ? uploadHistory.filter(item => item.uploader === currentUser.memberName)
    : uploadHistory;

  // 여러 필터 조건에 따라 데이터를 필터링합니다.
  const filteredHistory = userFilteredHistory
    .filter(item => 
      item.patientId.toLowerCase().includes(patientIdFilter.toLowerCase())
    )
    .filter(item => 
      item.uploader.toLowerCase().includes(uploaderFilter.toLowerCase())
    )
    .filter(item => 
      item.registrationDate.includes(dateFilter)
    )
    .filter(item => {
      if (statusFilter === 'ALL') return true;
      return item.status === statusFilter;
    });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>업로드 내역</h1>
      
      {/* 필터 컨트롤 */}
      <div className={styles.filterContainer}>
        <div>
          <label htmlFor="patientId" className={styles.filterLabel}>환자 ID</label>
          <input
            id="patientId"
            type="text"
            placeholder="환자 ID로 검색..."
            className={styles.filterInput}
            value={patientIdFilter}
            onChange={(e) => setPatientIdFilter(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="uploader" className={styles.filterLabel}>업로더</label>
          <input
            id="uploader"
            type="text"
            placeholder="업로더로 검색..."
            className={styles.filterInput}
            value={uploaderFilter}
            onChange={(e) => setUploaderFilter(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="regDate" className={styles.filterLabel}>등록일</label>
          <input
            id="regDate"
            type="date"
            className={styles.filterInput}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className={styles.statusFilterContainer}>
          <label className={styles.filterLabel}>상태</label>
          <div className={styles.statusButtonGroup}>
            <button onClick={() => setStatusFilter('ALL')} className={`${styles.statusButton} ${getStatusButtonClass('ALL')}`}>
              전체
            </button>
            <button onClick={() => setStatusFilter('PENDING')} className={`${styles.statusButton} ${getStatusButtonClass('PENDING')}`}>
              PENDING
            </button>
            <button onClick={() => setStatusFilter('COMPLETED')} className={`${styles.statusButton} ${getStatusButtonClass('COMPLETED')}`}>
              COMPLETED
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>X-ray ID</th>
              <th>환자 ID</th>
              <th>업로더</th>
              <th>등록일</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyRow}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr key={item.xrayId} className={styles.tableRow}>
                  <td>{item.xrayId}</td>
                  <td>{item.patientId}</td>
                  <td>{item.uploader}</td>
                  <td>{item.registrationDate}</td>
                  <td>{getStatusChip(item.status)}</td>
                  <td className={styles.actionCell}>
                    {/* 삭제 버튼 권한 제어 */}
                    {(currentUser && (currentUser.role === 'ADMIN' || (currentUser.role === 'XRAY_OPERATOR' && currentUser.memberName === item.uploader))) && (
                      <button 
                        onClick={() => handleDelete(item.xrayId)} 
                        className={styles.deleteButton}
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UploadHistory;

