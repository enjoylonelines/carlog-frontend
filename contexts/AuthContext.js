'use client';

import { addAuthHeader, removeAuthHeader } from '@/api/AxiosConfig';
import { createContext, startTransition, useCallback, useEffect, useRef, useState } from 'react';

// JWT 페이로드에서 만료 시각(ms)을 추출
function parseJwtExpiry(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

// 만료 경고를 표시할 기준 (5분 전)
const WARN_BEFORE_MS = 5 * 60 * 1000;

// 컴포넌트에서 AuthContext를 사용하므로 export 해야함
export const AuthContext = createContext();

// 배치를 위한 컴포넌트
function AuthContextProvider({ children }) {
  // 상태 정의
  const [user, setUser] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState(null);
  // Axios 설정 중에 UI가 나오지 않도록 하는 플래그 변수
  const [isLoading, setIsLoading] = useState(true);
    // 토큰 만료 관련 상태
    const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
    const [showExpiryWarning, setShowExpiryWarning] = useState(false);
    // 로그인 모달 상태
    const [showLoginModal, setShowLoginModal] = useState(false);
    // 로그인 후 리다이렉트할 URL
    const [redirectUrl, setRedirectUrl] = useState(null);
    // 헤더에 표시할 프로필 이미지 URL (프로필 편집 시 즉시 반영)
    const [navProfileImageUrl, setNavProfileImageUrl] = useState(null);
    const warnTimerRef = useRef(null);
    const expireTimerRef = useRef(null);

    // 로그아웃 함수 (Context에서 통합 관리)
    const logout = useCallback(() => {
        setUser("");
        setAccessToken("");
        setUserId(null);
        setTokenExpiresAt(null);
        setShowExpiryWarning(false);
        setRedirectUrl(null);
        setNavProfileImageUrl(null);
        // 로컬 스토리지 클리어
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        // Axios 헤더에서 인증 정보 제거
        removeAuthHeader();
    }, []);

  // Context를 통해서 제공할 전역 객체
  const value = {
    user,
    setUser,
    accessToken,
    setAccessToken,
    userId,
    setUserId,
    tokenExpiresAt,
    showExpiryWarning,
    setShowExpiryWarning,
    showLoginModal,
    setShowLoginModal,
    redirectUrl,
    setRedirectUrl,
    logout,
    navProfileImageUrl,
    setNavProfileImageUrl,
  };

  // 브라우저가 리프레쉬되었을 때(애플리케이션이 다시 시작할때) 실행되는 자동 콜백 함수 등록
  // 로컬 스토리지에 저장된 로그인 정보를 읽고 다시 전역 상태로 복원
  useEffect(() => {
    // 로컬 스토리지에서 로그인 정보 읽기
    const storedUser = localStorage.getItem('user') || '';
    const storedToken = localStorage.getItem('accessToken') || '';
    const storedUserId = localStorage.getItem('userId');
    // 상태 변경 전에 미리 Authorization 헤더를 세팅
    if (storedUser) {
      addAuthHeader(storedToken);
    }

    // 상태 변경
    startTransition(() => {
      setUser(storedUser);
      setAccessToken(storedToken);
      setUserId(storedUserId ? Number(storedUserId) : null);
      // Axios 설정 및 전역 상태 설정이 완료되었을 때 플래그 변수를 false로 설정
      setIsLoading(false);
    });
  }, []);

    // accessToken이 변경될 때 만료 타이머 등록
    useEffect(() => {
        // 기존 타이머 클리어
        clearTimeout(warnTimerRef.current);
        clearTimeout(expireTimerRef.current);
        setShowExpiryWarning(false);

        if (!accessToken) {
            setTokenExpiresAt(null);
            return;
        }

        const expiresAt = parseJwtExpiry(accessToken);
        setTokenExpiresAt(expiresAt);

        if (!expiresAt) return;

        const now = Date.now();
        const msUntilWarn = expiresAt - now - WARN_BEFORE_MS;
        const msUntilExpire = expiresAt - now;

        // 이미 만료된 경우 즉시 로그아웃
        if (msUntilExpire <= 0) {
            logout();
            return;
        }

        // 만료 5분 전: 경고 표시
        if (msUntilWarn > 0) {
            warnTimerRef.current = setTimeout(() => {
                setShowExpiryWarning(true);
            }, msUntilWarn);
        } else {
            // 이미 5분 이내 → 즉시 경고 표시
            setShowExpiryWarning(true);
        }

        // 만료 시각: 자동 로그아웃
        expireTimerRef.current = setTimeout(() => {
            setShowExpiryWarning(false);
            logout();
        }, msUntilExpire);

        return () => {
            clearTimeout(warnTimerRef.current);
            clearTimeout(expireTimerRef.current);
        };
    }, [accessToken, logout]);

  // 로그인/로그아웃으로 상태가 변경되었을 때 실행되는 자동 콜백 함수 등록
  useEffect(() => {
    // 로그인 했을 경우
    if (user != '') {
      // 로컬 스토리지에 user, accessToken, userId 저장
      localStorage.setItem('user', user);
      localStorage.setItem('accessToken', accessToken);
      if (userId != null) localStorage.setItem('userId', userId);
      // Axios 설정 변경(기본 요청 헤더에 Authorization을 추가)
      addAuthHeader(accessToken);
    }
    // 로그아웃 했을 경우
    else {
      // 사용자가 로그아웃을 할때만 실행
      if (!isLoading) {
        // 로컬 스토리지에 user, accessToken, userId 삭제
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        // Axios 설정 변경(기본 요청 헤더에 Authorization을 삭제)
        removeAuthHeader();
      }
    }
  }, [user, accessToken, userId, isLoading]);

  // Axios 및 전역 상태가 설정 중일 경우 UI를 보여주지 않음
  if (isLoading) {
    return null;
  } else {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
}

export default AuthContextProvider;
