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

      // Fallback: try search endpoint with empty query
      if (!list || list.length === 0) {
        try {
          res = await api.get('/members/doctors/search', { params: { q: '' } });
          list = parseList(res.data);
        } catch (e) {
          // ignore and keep first error
        }
      }

      setOptions(list || []);
    } catch (err) {
      setError('의사 목록을 불러오지 못했습니다.');
      setOptions([]);
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
