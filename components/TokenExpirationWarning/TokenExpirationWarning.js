"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import styles from "./TokenExpirationWarning.module.css";

export default function TokenExpirationWarning() {
  const { showExpiryWarning, setShowExpiryWarning, tokenExpiresAt, logout } =
    useContext(AuthContext);
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(null);

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
    router.push("/login");
  };

  const handleDismiss = () => {
    setShowExpiryWarning(false);
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
          <button className={styles.dismissBtn} onClick={handleDismiss}>
            계속 사용
          </button>
        </div>
      </div>
    </div>
  );
}
