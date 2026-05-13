'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUserProfile,
  updateUserAccount,
  checkLoginIdAvailable,
  checkEmailAvailable,
} from '../../lib/api';
import styles from './page.module.css';

export default function EditAccountPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 폼 필드
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 중복 확인 상태
  const [loginIdStatus, setLoginIdStatus] = useState(null); // null | 'ok' | 'dup'
  const [emailStatus, setEmailStatus] = useState(null);
  const [originalLoginId, setOriginalLoginId] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      router.push('/login');
      return;
    }
    const id = Number(storedId);
    setUserId(id);
    getUserProfile(id).then((data) => {
      if (data) {
        setLoginId(data.loginId || '');
        setEmail(data.email || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setOriginalLoginId(data.loginId || '');
        setOriginalEmail(data.email || '');
      }
      setLoading(false);
    });
  }, []);

  const handleCheckLoginId = async () => {
    if (!loginId.trim()) return;
    if (loginId === originalLoginId) {
      setLoginIdStatus('ok');
      return;
    }
    const res = await checkLoginIdAvailable(userId, loginId);
    setLoginIdStatus(res?.duplicate ? 'dup' : 'ok');
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) return;
    if (email === originalEmail) {
      setEmailStatus('ok');
      return;
    }
    const res = await checkEmailAvailable(userId, email);
    setEmailStatus(res?.duplicate ? 'dup' : 'ok');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginId.trim() || !email.trim() || !username.trim()) {
      setError('아이디, 이메일, 닉네임은 필수 항목입니다.');
      return;
    }
    if (loginId !== originalLoginId && loginIdStatus !== 'ok') {
      setError('아이디 중복 확인을 해주세요.');
      return;
    }
    if (email !== originalEmail && emailStatus !== 'ok') {
      setError('이메일 중복 확인을 해주세요.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword && !currentPassword) {
      setError('비밀번호를 변경하려면 현재 비밀번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { loginId, email, username, bio };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await updateUserAccount(userId, payload);
      setSuccess('회원 정보가 성공적으로 수정되었습니다.');
      setOriginalLoginId(loginId);
      setOriginalEmail(email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoginIdStatus(null);
      setEmailStatus(null);
    } catch {
      setError('수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>회원 정보 수정</h1>

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* 아이디 */}
          <div className={styles.field}>
            <label className={styles.label}>아이디</label>
            <div className={styles.inputRow}>
              <input
                className={`${styles.input} ${loginIdStatus === 'ok' ? styles.inputOk : loginIdStatus === 'dup' ? styles.inputErr : ''}`}
                type="text"
                value={loginId}
                onChange={(e) => { setLoginId(e.target.value); setLoginIdStatus(null); }}
                autoComplete="username"
              />
              <button type="button" className={styles.checkBtn} onClick={handleCheckLoginId}>
                중복 확인
              </button>
            </div>
            {loginIdStatus === 'ok' && <span className={styles.msgOk}>사용 가능한 아이디입니다.</span>}
            {loginIdStatus === 'dup' && <span className={styles.msgErr}>이미 사용 중인 아이디입니다.</span>}
          </div>

          {/* 이메일 */}
          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <div className={styles.inputRow}>
              <input
                className={`${styles.input} ${emailStatus === 'ok' ? styles.inputOk : emailStatus === 'dup' ? styles.inputErr : ''}`}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailStatus(null); }}
                autoComplete="email"
              />
              <button type="button" className={styles.checkBtn} onClick={handleCheckEmail}>
                중복 확인
              </button>
            </div>
            {emailStatus === 'ok' && <span className={styles.msgOk}>사용 가능한 이메일입니다.</span>}
            {emailStatus === 'dup' && <span className={styles.msgErr}>이미 사용 중인 이메일입니다.</span>}
          </div>

          {/* 닉네임 */}
          <div className={styles.field}>
            <label className={styles.label}>닉네임</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* 소개 */}
          <div className={styles.field}>
            <label className={styles.label}>소개</label>
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="자기소개를 입력하세요"
            />
          </div>

          {/* 비밀번호 변경 (선택) */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>비밀번호 변경 (선택)</div>

            <div className={styles.field}>
              <label className={styles.label}>현재 비밀번호</label>
              <input
                className={styles.input}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="변경 시에만 입력"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>새 비밀번호</label>
              <input
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="변경 시에만 입력"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>새 비밀번호 확인</label>
              <input
                className={`${styles.input} ${confirmPassword && newPassword !== confirmPassword ? styles.inputErr : ''}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="변경 시에만 입력"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <span className={styles.msgErr}>비밀번호가 일치하지 않습니다.</span>
              )}
            </div>
          </div>

          {error && <p className={styles.msgErr}>{error}</p>}
          {success && <p className={styles.msgOk}>{success}</p>}

          <div className={styles.btnGroup}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? '저장 중...' : '수정 완료'}
            </button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => router.push('/profile')}
              disabled={submitting}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
