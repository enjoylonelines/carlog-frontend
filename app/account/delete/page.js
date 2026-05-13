'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function DeleteAccountPage() {
  const router = useRouter();

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <h1 className={styles.title}>회원 탈퇴</h1>
        <p className={styles.desc}>
          정말로 탈퇴하시겠습니까?<br />
          탈퇴 시 작성하신 게시물, 댓글, 팔로우 정보 등<br />
          모든 활동 내역이 삭제됩니다.
        </p>

        <div className={styles.btnGroup}>
          <button
            className={styles.btnDanger}
            onClick={() => router.push('/account/delete-confirm')}
          >
            탈퇴하기
          </button>
          <button
            className={styles.btnCancel}
            onClick={() => router.push('/profile')}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
