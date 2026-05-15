"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import authApi from "@/api/authApi";
import styles from "./TokenExpirationWarning.module.css";

export default function TokenExpirationWarning() {
  const { showExpiryWarning, setShowExpiryWarning, tokenExpiresAt, logout, setUser, setAccessToken, setUserId } =
    useContext(AuthContext);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 뒤로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = () => {
      if (showExpiryWarning) {
        setShowExpiryWarning(false);
        // 뒤로가기를 자연스럽게 진행 (이전 페이지로 이동)
      }
    };

    if (showExpiryWarning) {
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [showExpiryWarning, setShowExpiryWarning]);

  // 남은 시간 카운트다운
  useEffect(() => {
    if (!showExpiryWarning || !tokenExpiresAt) return;

    const update = () => {
      const remaining = Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [showExpiryWarning, tokenExpiresAt]);

  const handleLogout = () => {
    setShowExpiryWarning(false);
    logout();
  };

  const handleContinueUse = () => {
    setShowLoginForm(true);
    setLoginError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await authApi.login(identifier, password);
      const { accessToken, username, userId } = res.data;
      
      // 새 토큰으로 업데이트 (기존 토큰 자동 파기)
      setUser(username);
      setAccessToken(accessToken);
      setUserId(userId);
      
      // 모달 닫기
      setShowExpiryWarning(false);
      setShowLoginForm(false);
      setIdentifier('');
      setPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCancel = () => {
    setShowLoginForm(false);
    setIdentifier('');
    setPassword('');
    setLoginError('');
  };

  if (!showExpiryWarning) return null;

  const minutes = secondsLeft != null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft != null ? secondsLeft % 60 : null;
  const timeStr =
    minutes != null
      ? `${minutes}분 ${String(seconds).padStart(2, "0")}초`
      : "";

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {!showLoginForm ? (
          <>
            <h3 className={styles.title}>로그인 세션 만료 예정</h3>
            <p className={styles.message}>
              {timeStr ? (
                <>
                  <span className={styles.timer}>{timeStr}</span> 후 로그인 세션이
                  만료됩니다.
                </>
              ) : (
                "곧 로그인 세션이 만료됩니다."
              )}
            </p>
            <p className={styles.sub}>
              계속 사용하시려면 재로그인이 필요합니다.
            </p>
            <div className={styles.actions}>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                지금 로그아웃
              </button>
              <button className={styles.continueBtn} onClick={handleContinueUse}>
                계속 사용
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className={styles.title}>로그인</h3>
            <form className={styles.loginForm} onSubmit={handleLoginSubmit}>
              <div className={styles.field}>
                <input
                  type="text"
                  placeholder="아이디 또는 이메일"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              {loginError && <p className={styles.error}>{loginError}</p>}
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={loginLoading}
                >
                  {loginLoading ? '로그인 중...' : '로그인'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={handleCancel}
                  disabled={loginLoading}
                >
                  취소
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
