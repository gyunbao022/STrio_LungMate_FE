import React, { useState, useEffect } from 'react';
import api from '../services/api/client';
import styles from '../styles/pages/UploadHistory.module.css';

// App.js로부터 currentUser를 props로 받습니다.
function UploadHistory({ currentUser }) {
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 필터 상태 관리
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 등록일 필터 추가
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 업로드 내역 불러오기
  useEffect(() => {
    const fetchUploadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 백엔드 API 엔드포인트
        // ADMIN은 전체 내역, XRAY_OPERATOR는 본인 업로드만
        const endpoint = currentUser?.role === 'ADMIN' || currentUser?.role === 'A'
          ? '/xray/history/all'  // 관리자용: 전체 내역
          : '/xray/history';      // 일반 사용자: 본인 내역만
          
        const response = await api.get(endpoint);
        
        // 응답 데이터 형식에 맞게 매핑
        const historyData = Array.isArray(response.data) ? response.data.map(item => ({
          xrayId: item.xrayId || item.id || item.xray_id,
          patientId: item.patientId || item.patient_id,
          uploader: item.uploaderName || item.uploaderId || item.uploader_name,
          registrationDate: item.uploadDate || item.registrationDate || item.createdAt || item.upload_date,
          status: item.status || 'PENDING'
        })) : [];
        
        setUploadHistory(historyData);
      } catch (err) {
        console.error('업로드 내역 조회 실패:', err);
        
        // 404면 데이터가 없는 것으로 처리
        if (err.response?.status === 404) {
          setUploadHistory([]);
          setError(null);
        } else {
          setError('업로드 내역을 불러오는데 실패했습니다.');
          setUploadHistory([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchUploadHistory();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleDelete = async (xrayIdToDelete) => {
    if (!window.confirm(`X-ray ID ${xrayIdToDelete}를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 백엔드 삭제 API 호출
      await api.delete(`/xray/${xrayIdToDelete}`);
      
      // 로컬 상태 업데이트
      const updatedHistory = uploadHistory.filter(item => item.xrayId !== xrayIdToDelete);
      setUploadHistory(updatedHistory);
      
      alert('삭제되었습니다.');
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
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
      
      {!currentUser ? (
        <div className={styles.emptyMessage}>
          로그인이 필요합니다.
        </div>
      ) : (
        <>
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
            {isLoading ? (
              <tr>
                <td colSpan="6" className={styles.emptyRow}>
                  로딩 중...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className={styles.emptyRow}>
                  {error}
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
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
                    {(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'A' || (currentUser.role === 'XRAY_OPERATOR' && currentUser.memberName === item.uploader))) && (
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
        </>
      )}
    </div>
  );
}

export default UploadHistory;

