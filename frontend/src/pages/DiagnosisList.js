import React, { useState } from 'react';
import styles from '../styles/pages/DiagnosisList.module.css';

// 예시용 데이터입니다. 실제 애플리케이션에서는 API를 통해 받아오는 데이터로 대체해야 합니다.
const initialDiagnosisData = [
  {
    xrayId: '5012',
    patientId: '100023',
    uploader: 'xray01',
    registrationDate: '2025-09-30',
    status: 'PENDING',
  },
  {
    xrayId: '5013',
    patientId: '100024',
    uploader: 'xray02',
    registrationDate: '2025-09-30',
    status: 'PENDING',
  },
  {
    xrayId: '5014',
    patientId: '100025',
    uploader: 'xray01',
    registrationDate: '2025-10-01',
    status: 'COMPLETED', // 판독 완료된 항목 추가
  },
];

function DiagnosisList({ onNavigate }) {
  const [diagnosisData] = useState(initialDiagnosisData);

  // 필터 상태 관리
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // 여러 필터 조건에 따라 데이터를 필터링합니다.
  const filteredData = diagnosisData
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
      <h1 className={styles.title}>판독 리스트</h1>
      
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
              <th>환자ID</th>
              <th>업로더</th>
              <th>등록일</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyRow}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.xrayId} className={styles.tableRow}>
                  <td>{item.xrayId}</td>
                  <td>{item.patientId}</td>
                  <td>{item.uploader}</td>
                  <td>{item.registrationDate}</td>
                  <td>{getStatusChip(item.status)}</td>
                  <td className={styles.actionCell}>
                    <button onClick={() => onNavigate('view-diagnosis', { xrayId: item.xrayId })} className={styles.openButton}>
                      열기
                    </button>
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

export default DiagnosisList;