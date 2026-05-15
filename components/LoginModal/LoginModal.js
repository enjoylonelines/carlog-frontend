"use client";

import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import authApi from "@/api/authApi";
import { checkLoginIdAvailable, checkEmailAvailable } from "@/api/user";
import styles from "./LoginModal.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginModal({ showLoginModal, setShowLoginModal }) {
  const router = useRouter();
  const { setUser, setAccessToken, setUserId } = useContext(AuthContext);
  const [mode, setMode] = useState("login"); // "login" | "register"

  // 로그인 폼
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // 회원가입 폼
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // 중복 확인 상태
  const [loginIdStatus, setLoginIdStatus] = useState(null); // null | 'ok' | 'dup'
  const [emailStatus, setEmailStatus] = useState(null);
  const [checkingId, setCheckingId] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 뒤로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = () => {
      if (showLoginModal) {
        setShowLoginModal(false);
        // 뒤로가기를 자연스럽게 진행 (이전 페이지로 이동)
      }
    };

    if (showLoginModal) {
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [showLoginModal, setShowLoginModal]);

  // X 버튼 클릭 시 홈으로 이동
  const handleCloseModal = () => {
    router.push('/');
    setShowLoginModal(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(identifier, password);
      const { accessToken, username, userId } = res.data;

      setUser(username);
      setAccessToken(accessToken);
      setUserId(userId);

      setShowLoginModal(false);
      setIdentifier("");
      setPassword("");
    } catch (err) {
      const msg = err.response?.data?.message || "아이디 또는 비밀번호가 올바르지 않습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLoginId = async () => {
    if (!loginId.trim()) {
      setError("아이디를 입력해주세요.");
      return;
    }
    setCheckingId(true);
    try {
      const res = await checkLoginIdAvailable(0, loginId);
      if (res?.available) {
        setLoginIdStatus("ok");
        setError("");
      } else {
        setLoginIdStatus("dup");
        setError(res?.message || "아이디 확인에 실패했습니다.");
      }
    } catch (err) {
      setLoginIdStatus("dup");
      setError(err.response?.data?.message || "아이디 확인에 실패했습니다.");
    } finally {
      setCheckingId(false);
    }
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await checkEmailAvailable(0, email);
      if (res?.available) {
        setEmailStatus("ok");
        setError("");
      } else {
        setEmailStatus("dup");
        setError(res?.message || "이메일 확인에 실패했습니다.");
      }
    } catch (err) {
      setEmailStatus("dup");
      setError(err.response?.data?.message || "이메일 확인에 실패했습니다.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (loginIdStatus !== "ok") {
      setError("아이디 중복을 확인해주세요.");
      return;
    }
    if (emailStatus !== "ok") {
      setError("이메일 중복을 확인해주세요.");
      return;
    }

    setLoading(true);

    try {
      await authApi.register(loginId, regPassword, email);
      setMode("login");
      setIdentifier(loginId);
      setPassword("");
      setLoginId("");
      setEmail("");
      setRegPassword("");
      setLoginIdStatus(null);
      setEmailStatus(null);
      setError("");
    } catch (err) {
      const msg = err.response?.data?.message || "회원가입에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!showLoginModal) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.logo}>
            <span className={styles.logoDot} />
            CARLOG
          </div>
          <button className={styles.closeBtn} onClick={handleCloseModal}>✕</button>
        </div>
        <p className={styles.tagline}>자동차 이야기를 나누는 공간</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            로그인
          </button>
          <button
            className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            회원가입
          </button>
        </div>

        {mode === "login" ? (
          <form className={styles.form} onSubmit={handleLoginSubmit}>
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

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRegisterSubmit}>
            <div className={styles.fieldWithBtn}>
              <div className={styles.field}>
                <input
                  type="text"
                  placeholder="4~20자 아이디"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setLoginIdStatus(null);
                  }}
                  minLength={4}
                  maxLength={20}
                  required
                  className={styles.input}
                />
              </div>
              <button
                type="button"
                className={`${styles.checkBtn} ${loginIdStatus === "ok" ? styles.checkBtnOk : ""}`}
                onClick={handleCheckLoginId}
                disabled={checkingId || !loginId.trim()}
              >
                {checkingId ? "확인 중..." : loginIdStatus === "ok" ? "✓" : "중복확인"}
              </button>
            </div>

            <div className={styles.fieldWithBtn}>
              <div className={styles.field}>
                <input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailStatus(null);
                  }}
                  required
                  className={styles.input}
                />
              </div>
              <button
                type="button"
                className={`${styles.checkBtn} ${emailStatus === "ok" ? styles.checkBtnOk : ""}`}
                onClick={handleCheckEmail}
                disabled={checkingEmail || !email.trim()}
              >
                {checkingEmail ? "확인 중..." : emailStatus === "ok" ? "✓" : "중복확인"}
              </button>
            </div>

            <div className={styles.field}>
              <input
                type="password"
                placeholder="8자 이상 비밀번호"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                minLength={8}
                required
                className={styles.input}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
