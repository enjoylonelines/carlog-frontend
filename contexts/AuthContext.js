"use client"

import { addAuthHeader, removeAuthHeader } from "@/api/AxiosConfig";
import { createContext, startTransition, useEffect, useState } from "react";

// 컴포넌트에서 AuthContext를 사용하므로 export 해야함
export const AuthContext = createContext();

// 배치를 위한 컴포넌트
function AuthContextProvider({ children }) {
    // 상태 정의
    const [user, setUser] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [userId, setUserId] = useState(null);
    // Axios 설정 중에 UI가 나오지 않도록 하는 플래그 변수
    const [isLoading, setIsLoading] = useState(true);

    // Context를 통해서 제공할 전역 객체
    const value = {
        user,
        setUser,
        accessToken,
        setAccessToken,
        userId,
        setUserId,
    };

    // 브라우저가 리프레쉬되었을 때(애플리케이션이 다시 시작할때) 실행되는 자동 콜백 함수 등록
    // 로컬 스토리지에 저장된 로그인 정보를 읽고 다시 전역 상태로 복원
    useEffect(() => {
        // 로컬 스토리지에서 로그인 정보 읽기
        const storedUser = localStorage.getItem("user") || "";
        const storedToken = localStorage.getItem("accessToken") || "";
        const storedUserId = localStorage.getItem("userId");
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

    // 로그인/로그아웃으로 상태가 변경되었을 때 실행되는 자동 콜백 함수 등록
    useEffect(() => {
        // 로그인 했을 경우
        if (user != "") {
            // 로컬 스토리지에 user, accessToken, userId 저장
            localStorage.setItem("user", user);
            localStorage.setItem("accessToken", accessToken);
            if (userId != null) localStorage.setItem("userId", userId);
            // Axios 설정 변경(기본 요청 헤더에 Authorization을 추가)
            addAuthHeader(accessToken);
        }
        // 로그아웃 했을 경우
        else {
            // 사용자가 로그아웃을 할때만 실행
            if (!isLoading) {
                // 로컬 스토리지에 user, accessToken, userId 삭제
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userId");
                // Axios 설정 변경(기본 요청 헤더에 Authorization을 삭제)
                removeAuthHeader();
            }
        }
    }, [user, accessToken, userId, isLoading]);

    // Axios 및 전역 상태가 설정 중일 경우 UI를 보여주지 않음
    if (isLoading) {
        return null;
    } else {
        return (
            <AuthContext.Provider value={value}>
                {children}
            </AuthContext.Provider>
        );
    }
}

export default AuthContextProvider;
