import React, { useState, useEffect } from 'react';
import api from '../services/api/client';
import styles from '../styles/pages/UploadHistory.module.css';

function DiagnosisList({ currentUser }, onNavigate) {
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 필터 상태
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ✅ 페이징 상태
  const [pageInfo, setPageInfo] = useState({
    startPage: 1,
    endPage: 1,
    totalPage: 1,
    currentPage: 1,
  });

  /** ✅ 현재 사용자 기준 ID 정규화 (소문자, 공백 제거) */
  const toKey = (v) => (v == null ? '' : String(v).trim().toLowerCase());
  const userIdSet = new Set(
    [
      currentUser?.memberId,
      currentUser?.userId,
      currentUser?.username,
      currentUser?.userName,
      currentUser?.loginId,
      currentUser?.id,
    ]
      .filter(Boolean)
      .map(toKey)
  );

  /** ✅ 업로드 내역 조회 함수 */
  const fetchUploadHistory = async (pageNum = 1) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      // ✅ 로그인된 사용자 세션 기준으로 조회 (role/uploaderId 안 보냄)
      const response = await api.get(`/xray/listD/${pageNum}`);

      const rawList = response.data?.xrayList || [];
      const pv = response.data?.pv || {};

      // ✅ 페이지 정보 저장
      setPageInfo({
        startPage: pv.startPage ?? 1,
        endPage: pv.endPage ?? 1,
        totalPage: pv.totalPage ?? 1,
        currentPage: pv.currentPage ?? 1,
      });

      // ✅ 데이터 매핑
      const historyData = Array.isArray(rawList)
        ? rawList.map((item) => {
            const rawStatus = item.statusCd ?? item.status_cd ?? item.status;
            const norm = rawStatus ? String(rawStatus).toUpperCase() : '';
            const mappedStatus =
              !norm
                ? 'PENDING'
                : norm === 'D'
                ? 'COMPLETED'
                : norm === 'P' || norm === 'PENDING'
                ? 'PENDING'
                : norm;

            return {
              xrayId: item.xrayId ?? item.id ?? item.xray_id,
              patientId: item.patientId ?? item.patient_id,
              uploaderId:
                item.uploaderId ?? item.uploader_id ?? item.uploader,
              uploaderName:
                item.uploaderName ??
                item.uploader_name ??
                item.uploaderId ??
                item.uploader_id ??
                '',
              registrationDate:
                item.uploadDate ??
                item.registrationDate ??
                item.createdAt ??
                item.upload_date,
              statusCd: rawStatus ?? '',
              status: mappedStatus,
            };
          })
        : [];

      setUploadHistory(historyData);
    } catch (err) {
      console.error('업로드 내역 조회 실패:', err);
      if (err.response?.status === 404) {
        setUploadHistory([]);
        setError(null);
      } else {
        setError('업로드 내역을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };






  /** ✅ 처음 오픈 시 자동 조회 */
  useEffect(() => {
    if (currentUser) fetchUploadHistory(1);
  }, [currentUser]);

  /** ✅ 삭제 처리 */
  const handleDelete = async (xrayIdToDelete) => {
    if (!window.confirm(`X-ray ID ${xrayIdToDelete}를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/xray/${xrayIdToDelete}`);
      setUploadHistory((prev) =>
        prev.filter((item) => item.xrayId !== xrayIdToDelete)
      );
      alert('삭제되었습니다.');
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  /** ✅ 상태 매핑 */
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
    return statusFilter === filterName
      ? styles.statusButtonActive
      : styles.statusButtonInactive;
  };

  // ✅ 필터 조건 반영
  const filteredHistory = uploadHistory
    .filter((item) => String(item.patientId || '').includes(patientIdFilter))
    .filter((item) =>
      (item.uploaderName || '')
        .toLowerCase()
        .includes(uploaderFilter.toLowerCase())
    )
    .filter((item) => String(item.registrationDate || '').includes(dateFilter))
    .filter((item) => {
      if (statusFilter === 'ALL') return true;
      return item.status === statusFilter;
    });

  return (
    <div className={styles.container}>
      {/* ✅ 제목 + 조회버튼 한 줄 */}
      <div className={styles.titleBar}>
        <h1 className={styles.title}>업로드 내역</h1>
        <button
          onClick={() => fetchUploadHistory(1)}
          className={styles.searchButton}
        >
          조회
        </button>
      </div>

      {!currentUser ? (
        <div className={styles.emptyMessage}>로그인이 필요합니다.</div>
      ) : (
        <>
          {/* ✅ 필터 영역 */}
          <div className={styles.filterContainer}>
            <div>
              <label className={styles.filterLabel}>환자 ID</label>
              <input
                type="text"
                placeholder="환자 ID로 검색..."
                className={styles.filterInput}
                value={patientIdFilter}
                onChange={(e) =>
                  setPatientIdFilter(e.target.value.replace(/\D/g, ''))
                }
              />
            </div>
            <div>
              <label className={styles.filterLabel}>업로더</label>
              <input
                type="text"
                placeholder="업로더로 검색..."
                className={styles.filterInput}
                value={uploaderFilter}
                onChange={(e) => setUploaderFilter(e.target.value)}
              />
            </div>
            <div>
              <label className={styles.filterLabel}>등록일</label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className={styles.statusFilterContainer}>
              <label className={styles.filterLabel}>상태</label>
              <div className={styles.statusButtonGroup}>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`${styles.statusButton} ${getStatusButtonClass('ALL')}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`${styles.statusButton} ${getStatusButtonClass('PENDING')}`}
                >
                  PENDING
                </button>
                <button
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`${styles.statusButton} ${getStatusButtonClass('COMPLETED')}`}
                >
                  COMPLETED
                </button>
              </div>
            </div>
          </div>

          {/* ✅ 테이블 */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>X-ray ID</th>
                  <th>환자 ID</th>
                  <th>업로더</th>
                  <th>등록일시</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyRow}>로딩 중...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyRow}>{error}</td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyRow}>검색 결과가 없습니다.</td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    const isOwner = userIdSet.has(toKey(item.uploaderId));
                    const isCompleted = mapStatus(item.status) === 'COMPLETED';
                    const canDelete = isOwner && !isCompleted;
                    return (
                      <tr key={item.xrayId} className={styles.tableRow}>
                        <td>{item.xrayId}</td>
                        <td>{item.patientId}</td>
                        <td>{item.uploaderName || item.uploaderId}</td>
                        <td>{item.registrationDate?.replace('T', ' ')}</td>
                        <td>{getStatusChip(item.status)}</td>
                        <td className={styles.actionCell}>
                          <button
                            onClick={() =>
                              onNavigate("view-diagnosis", { xrayId: item.xrayId })
                            }
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-5 rounded"
                          >
                            열기
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ 페이지네이션 */}
          <div className={styles.pagination}>
            <button
              onClick={() => fetchUploadHistory(pageInfo.startPage - 1)}
              disabled={pageInfo.startPage <= 1}
              className={styles.pageButton}
            >
              ◀ 이전
            </button>

            {/* ✅ 페이지 번호 목록 */}
            {Array.from(
              { length: pageInfo.endPage - pageInfo.startPage + 1 },
              (_, i) => {
                const pageNum = pageInfo.startPage + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchUploadHistory(pageNum)}
                    className={`${styles.pageNumber} ${
                      pageNum === pageInfo.currentPage ? styles.activePage : ''
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}

            <button
              onClick={() => fetchUploadHistory(pageInfo.endPage + 1)}
              disabled={pageInfo.endPage >= pageInfo.totalPage}
              className={styles.pageButton}
            >
              다음 ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DiagnosisList;
