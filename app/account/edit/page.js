'use client';
import { useState, useEffect } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserAccount, checkLoginIdAvailable, checkEmailAvailable } from '../../../api/user';
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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 중복 확인 상태
  const [loginIdStatus, setLoginIdStatus] = useState(null); // null | 'ok' | 'dup'
  const [emailStatus, setEmailStatus] = useState(null);
  const [originalLoginId, setOriginalLoginId] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');

  // 필드별 에러 메시지
  const [loginIdError, setLoginIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      router.push('/');
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
    if (!loginId.trim()) {
      setLoginIdError('아이디를 입력해주세요.');
      return;
    }
    if (loginId === originalLoginId) {
      setLoginIdStatus('ok');
      setLoginIdError('');
      return;
    }
    const res = await checkLoginIdAvailable(userId, loginId);
    const dup = res?.duplicate;
    setLoginIdStatus(dup ? 'dup' : 'ok');
    setLoginIdError(dup ? '이미 사용 중인 아이디입니다.' : '');
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (email === originalEmail) {
      setEmailStatus('ok');
      setEmailError('');
      return;
    }
    const res = await checkEmailAvailable(userId, email);
    const dup = res?.duplicate;
    setEmailStatus(dup ? 'dup' : 'ok');
    setEmailError(dup ? '이미 사용 중인 이메일입니다.' : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');

    // 클릭 시 전체 유효성 검사
    let hasError = false;

    if (!loginId.trim()) {
      setLoginIdError('아이디를 입력해주세요.');
      hasError = true;
    } else if (loginIdStatus === 'dup') {
      setLoginIdError('이미 사용 중인 아이디입니다.');
      hasError = true;
    } else if (loginId !== originalLoginId && loginIdStatus !== 'ok') {
      setLoginIdError('중복 확인이 필요합니다.');
      hasError = true;
    } else {
      setLoginIdError('');
    }

    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      hasError = true;
    } else if (emailStatus === 'dup') {
      setEmailError('이미 사용 중인 이메일입니다.');
      hasError = true;
    } else if (email !== originalEmail && emailStatus !== 'ok') {
      setEmailError('중복 확인이 필요합니다.');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (newPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    } else {
      setConfirmPasswordError('');
    }

    if (hasError) return;

    setError('');
    setSubmitting(true);
    try {
      const payload = { loginId, email, username: username.trim() || null, bio };
      if (newPassword) payload.newPassword = newPassword;
      await updateUserAccount(userId, payload);
      setSuccess('회원 정보가 성공적으로 수정되었습니다.');
      setOriginalLoginId(loginId);
      setOriginalEmail(email);
      setNewPassword('');
      setConfirmPassword('');
      setLoginIdStatus(null);
      setEmailStatus(null);
      setLoginIdError('');
      setEmailError('');
      setUsernameError('');
    } catch (err) {
      setError(err?.serverMessage || '수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
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
                onChange={(e) => {
                  setLoginId(e.target.value);
                  setLoginIdStatus(null);
                }}
                autoComplete="username"
              />
              <button type="button" className={styles.checkBtn} onClick={handleCheckLoginId}>
                중복 확인
              </button>
            </div>
            {loginIdStatus === 'ok' && <span className={styles.msgOk}>사용 가능한 아이디입니다.</span>}
            {loginIdStatus === 'dup' && <span className={styles.msgErr}>이미 사용 중인 아이디입니다.</span>}
            {!loginIdStatus && loginIdError && <span className={styles.msgErr}>{loginIdError}</span>}
          </div>

          {/* 이메일 */}
          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <div className={styles.inputRow}>
              <input
                className={`${styles.input} ${emailStatus === 'ok' ? styles.inputOk : emailStatus === 'dup' ? styles.inputErr : ''}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailStatus(null);
                }}
                autoComplete="email"
              />
              <button type="button" className={styles.checkBtn} onClick={handleCheckEmail}>
                중복 확인
              </button>
            </div>
            {emailStatus === 'ok' && <span className={styles.msgOk}>사용 가능한 이메일입니다.</span>}
            {emailStatus === 'dup' && <span className={styles.msgErr}>이미 사용 중인 이메일입니다.</span>}
            {!emailStatus && emailError && <span className={styles.msgErr}>{emailError}</span>}
          </div>

          {/* 닉네임 */}
          <div className={styles.field}>
            <label className={styles.label}>닉네임</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
              placeholder={loginId || String(userId)}
            />
            {usernameError && <span className={styles.msgErr}>{usernameError}</span>}
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
              <label className={styles.label}>변경할 비밀번호</label>
              <input
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setConfirmPasswordError('');
                }}
                autoComplete="new-password"
                placeholder="변경 시에만 입력"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>비밀번호 확인</label>
              <input
                className={`${styles.input} ${confirmPasswordError ? styles.inputErr : ''}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError('');
                }}
                autoComplete="new-password"
                placeholder="변경 시에만 입력"
              />
              {confirmPasswordError && <span className={styles.msgErr}>{confirmPasswordError}</span>}
            </div>
          </div>

          {error && <p className={styles.msgErr}>{error}</p>}
          {success && <p className={styles.msgOk}>{success}</p>}

          <div className={styles.btnGroup}>
            <button
              type="button"
              className={styles.btnDelete}
              onClick={() => router.push('/account/delete')}
              disabled={submitting}
            >
              회원 탈퇴
            </button>
            <div className={styles.btnGroupRight}>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? '저장 중...' : '수정 완료'}
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => router.push('/profile')}
                disabled={submitting}
              >
                <span style={{ opacity: 0 }}>.</span>
                취
                <span style={{ opacity: 0 }}>공.</span>
                소
                <span style={{ opacity: 0 }}>.</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
