import React, { useEffect, useState } from 'react';
import api from '../token/interceptors';
import styles from '../styles/components/DoctorPicker.module.css';

/**
 * DoctorPicker
 * - Simple Select dropdown that loads doctor IDs from backend on mount.
 *
 * Props:
 * - value: string | null
 * - onChange: (doctorId: string) => void
 * - placeholder?: string
 * - endpoint?: string (default: '/members/doctors')
 */
export default function DoctorPicker({ value, onChange, placeholder = '의사 ID를 선택하세요', endpoint = '/members/doctors' }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseList = (data) => {
    let list = [];
    if (Array.isArray(data)) {
      list = data.map((item) => {
        if (typeof item === 'string') return { id: item, label: item };
        const id = item.doctorId || item.memberId || item.username || item.userId || item.id || '';
        const name = item.name || item.memberName || item.fullName || '';
        const label = name ? `${id} (${name})` : id;
        return id ? { id, label } : null;
      }).filter(Boolean);
    } else if (data && Array.isArray(data.content)) {
      list = data.content.map((item) => {
        const id = item.doctorId || item.memberId || item.username || item.userId || item.id || '';
        const name = item.name || item.memberName || item.fullName || '';
        const label = name ? `${id} (${name})` : id;
        return id ? { id, label } : null;
      }).filter(Boolean);
    } else if (data && Array.isArray(data.merberList)) { // 백엔드 /member/list 형태 대응 (키: merberList)
      list = data.merberList.map((item) => {
        const id = item.memberId || item.userId || '';
        const name = item.memberName || item.userName || '';
        const role = item.role || item.roleCd || '';
        if (!id) return null;
        if (role && String(role).toUpperCase() !== 'D') return null; // 의사만 필터
        const label = name ? `${id} (${name})` : id;
        return { id, label };
      }).filter(Boolean);
    }
    return list;
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1st: try provided endpoint
      let res = await api.get(endpoint);
      let list = parseList(res.data);

      // If empty, try search endpoint
      if (!list || list.length === 0) {
        try {
          res = await api.get('/members/doctors/search', { params: { q: '' } });
          list = parseList(res.data);
        } catch {}
      }

      // If still empty, try legacy member list and filter role=D
      if (!list || list.length === 0) {
        try {
          res = await api.get('/member/list');
          list = parseList(res.data);
        } catch {}
      }

      setOptions(list || []);
    } catch (err) {
      // If initial endpoint failed (e.g., 403), attempt fallbacks here too
      try {
        let res = await api.get('/members/doctors/search', { params: { q: '' } });
        let list = parseList(res.data);
        if (!list || list.length === 0) {
          try {
            res = await api.get('/member/list');
            list = parseList(res.data);
          } catch {}
        }
        setOptions(list || []);
        if (!list || list.length === 0) setError('의사 목록이 비어 있습니다.');
      } catch (fallbackErr) {
        setError('의사 목록을 불러오지 못했습니다.');
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <div>
      <select className={styles.select} value={value || ''} onChange={handleChange}>
        <option value="" disabled>{loading ? '불러오는 중...' : (error || placeholder)}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
