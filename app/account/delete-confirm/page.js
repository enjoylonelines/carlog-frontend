'use client';
import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { deleteUser } from '../../lib/api';
import styles from './page.module.css';

export default function DeleteConfirmPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (immediate) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('로그인 정보를 찾을 수 없습니다.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await deleteUser(Number(userId), immediate);
      // 로그아웃 처리
      setUser('');
      setAccessToken('');
      localStorage.removeItem('userId');
      router.push('/login');
    } catch {
      setError('탈퇴 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className={styles.title}>탈퇴 방식 선택</h1>
        <p className={styles.desc}>
          탈퇴 방식을 선택해 주세요.
        </p>

        <div className={styles.optionGroup}>
          <div className={styles.option}>
            <h3 className={styles.optionTitle}>즉시 탈퇴</h3>
            <p className={styles.optionDesc}>
              계정과 모든 데이터가 즉시 삭제됩니다.<br />
              삭제된 데이터는 복구할 수 없습니다.
            </p>
            <button
              className={styles.btnDanger}
              onClick={() => handleDelete(true)}
              disabled={loading}
            >
              즉시 탈퇴
            </button>
          </div>

          <div className={styles.divider}>또는</div>

          <div className={styles.option}>
            <h3 className={styles.optionTitle}>탈퇴 처리 (보관)</h3>
            <p className={styles.optionDesc}>
              계정은 비활성화되고 데이터는 일정 기간 보관 후 삭제됩니다.
            </p>
            <button
              className={styles.btnSoft}
              onClick={() => handleDelete(false)}
              disabled={loading}
            >
              탈퇴 처리
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btnCancel}
          onClick={() => router.push('/account/delete')}
          disabled={loading}
        >
          이전으로
        </button>
      </div>
    </div>
  );
}
