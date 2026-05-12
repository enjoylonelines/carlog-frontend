"use client";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import authApi from "@/apis/authApi";
import styles from "./page.module.css";

export default function LoginPage() {
    const router = useRouter();
    const { setUser, setAccessToken } = useContext(AuthContext);

    const [mode, setMode] = useState("login"); // "login" | "register"

    // 로그인 폼
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    // 회원가입 폼
    const [loginId, setLoginId] = useState("");
    const [email, setEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await authApi.login(identifier, password);
            const { accessToken, username } = res.data;
            setUser(username);
            setAccessToken(accessToken);
            router.push("/");
        } catch (err) {
            const msg = err.response?.data?.message || "아이디 또는 비밀번호가 올바르지 않습니다.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authApi.register(loginId, regPassword, email);
            setMode("login");
            setIdentifier(loginId);
            setPassword("");
            setError("");
        } catch (err) {
            const msg = err.response?.data?.message || "회원가입에 실패했습니다.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <span className={styles.logoDot} />
                    CARLOG
                </div>
                <p className={styles.tagline}>자동차 이야기를 나누는 공간</p>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
                        onClick={() => { setMode("login"); setError(""); }}
                    >
                        로그인
                    </button>
                    <button
                        className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
                        onClick={() => { setMode("register"); setError(""); }}
                    >
                        회원가입
                    </button>
                </div>

                {mode === "login" ? (
                    <form className={styles.form} onSubmit={handleLogin}>
                        <div className={styles.field}>
                            <label className={styles.label}>아이디 또는 이메일</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="아이디 또는 이메일을 입력하세요"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>비밀번호</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <button className={styles.submit} type="submit" disabled={loading}>
                            {loading ? "로그인 중..." : "로그인"}
                        </button>
                    </form>
                ) : (
                    <form className={styles.form} onSubmit={handleRegister}>
                        <div className={styles.field}>
                            <label className={styles.label}>아이디</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="4~20자 아이디"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                minLength={4}
                                maxLength={20}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>이메일</label>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="이메일을 입력하세요"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>비밀번호</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="8자 이상"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <button className={styles.submit} type="submit" disabled={loading}>
                            {loading ? "처리 중..." : "회원가입"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
