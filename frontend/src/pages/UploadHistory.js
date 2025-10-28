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
        
        // 백엔드 실제 API 엔드포인트 사용: /xray/list/{page}
        const response = await api.get('/xray/list/1');
        
        // 응답 형식: { xrayList: [...], pv: {...} }
        const rawList = response.data?.xrayList || [];
        
        // 응답 데이터 형식에 맞게 매핑
        const historyData = Array.isArray(rawList) ? rawList.map(item => {
          const rawStatus = item.statusCd ?? item.status_cd ?? item.status;
          const norm = rawStatus ? String(rawStatus).toUpperCase() : '';
          const mappedStatus = !norm
            ? 'PENDING'
            : (norm === 'D'
                ? 'COMPLETED'
                : (norm === 'P' || norm === 'PENDING'
                    ? 'PENDING'
                    : norm));
          return {
            xrayId: item.xrayId ?? item.id ?? item.xray_id,
            patientId: item.patientId ?? item.patient_id,
            uploaderId: item.uploaderId ?? item.uploader_id ?? item.uploader,
            uploaderName: item.uploaderName ?? item.uploader_name ?? item.uploaderId ?? item.uploader_id ?? '',
            registrationDate: item.uploadDate ?? item.registrationDate ?? item.createdAt ?? item.upload_date,
            statusCd: rawStatus ?? '',
            status: mappedStatus,
          };
        }) : [];
        
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
    // 상태가 COMPLETED인 경우 서버 호출 전에 차단
    const target = uploadHistory.find((it) => it.xrayId === xrayIdToDelete);
    if (target && String(target.status).toUpperCase() === 'COMPLETED') {
      alert('완료 상태(COMPLETED)는 삭제할 수 없습니다.');
      return;
    }
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

  // DB 상태값을 화면에 맞게 변환
  // 상태코드/라벨을 화면 라벨로 변환 (관용적으로 이중 방어)
  const mapStatus = (val) => {
    if (!val) return 'PENDING';
    const u = String(val).toUpperCase();
    if (u === 'D') return 'COMPLETED';
    if (u === 'P') return 'PENDING';
    if (u === 'PENDING') return 'PENDING';
    if (u === 'COMPLETED') return 'COMPLETED';
    return u;
  };

  const getStatusChip = (status) => {
    const mapped = mapStatus(status);
    switch (mapped) {
      case 'PENDING':
        return <span className={styles.statusChipPending}>PENDING</span>;
      case 'COMPLETED':
        return <span className={styles.statusChipCompleted}>COMPLETED</span>;
      default:
        return <span className={styles.statusChipDefault}>{mapped}</span>;
    }
  };

  const getStatusButtonClass = (filterName) => {
    return statusFilter === filterName ? styles.statusButtonActive : styles.statusButtonInactive;
  };

  // 현재 사용자의 역할에 따라 초기 데이터를 필터링합니다.
  // XRAY_OPERATOR(또는 코드 'X')는 본인이 업로드한 항목만 볼 수 있도록 제한
  const userFilteredHistory = (() => {
    if (!currentUser) return uploadHistory;
    const roleCode = String(currentUser.role || '').toUpperCase();
    const isOperator = roleCode === 'XRAY_OPERATOR' || roleCode === 'X';
    if (!isOperator) return uploadHistory;

    const toKey = (v) => (v == null ? '' : String(v).trim().toLowerCase());
    const myIds = [
      currentUser.memberId,
      currentUser.userId,
      currentUser.username,
      currentUser.userName,
      currentUser.loginId,
      currentUser.id,
    ]
      .filter(Boolean)
      .map(toKey);

    // 중복 제거
    const myIdSet = new Set(myIds);

    return uploadHistory.filter((item) => myIdSet.has(toKey(item.uploaderId)));
  })();

  // 여러 필터 조건에 따라 데이터를 필터링합니다.
  const filteredHistory = userFilteredHistory
    .filter(item => {
      // patientId는 문자열로 처리 (백엔드가 String 타입이므로)
      const pid = String(item.patientId || '');
      return pid.includes(patientIdFilter);
    })
    .filter(item => {
      const name = (item.uploaderName || '').toLowerCase();
      return name.includes(uploaderFilter.toLowerCase());
    })
    .filter(item => {
      const regDate = String(item.registrationDate || '');
      return regDate.includes(dateFilter);
    })
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
            onChange={(e) => {
              // 숫자만 허용: 입력/붙여넣기 모두에서 숫자 외 문자 제거
              const onlyDigits = e.target.value.replace(/\D/g, '');
              setPatientIdFilter(onlyDigits);
            }}
            pattern="^[0-9]*$"
            title="숫자만 입력 (예: 12345)"
            inputMode="numeric"
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
              filteredHistory.map((item) => {
                const role = currentUser?.role;
                const isAdmin = role === 'ADMIN' || role === 'A';
                const isOperator = role === 'XRAY_OPERATOR' || role === 'X';
                // 업로더 소유 비교는 uploaderId 기준으로 수행
                const possibleIds = [currentUser?.memberId, currentUser?.userId, currentUser?.username].filter(Boolean);
                const isOwner = isOperator && possibleIds.includes(item.uploaderId);
                const isCompleted = mapStatus(item.status) === 'COMPLETED';
                const canDelete = (isAdmin || isOwner) && !isCompleted;

                return (
                  <tr key={item.xrayId} className={styles.tableRow}>
                    <td>{item.xrayId}</td>
                    <td>{item.patientId}</td>
                    <td>{item.uploaderName || item.uploaderId}</td>
                    <td>{item.registrationDate}</td>
                    <td>{getStatusChip(item.status)}</td>
                    <td className={styles.actionCell}>
                      {/* 삭제 버튼 권한 제어: 관리자 또는 자신이 업로드한 XRAY_OPERATOR, 단 COMPLETED는 숨김 */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item.xrayId)}
                          className={styles.deleteButton}
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
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

