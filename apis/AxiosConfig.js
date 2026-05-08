"use client"

import axios from "axios";

axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost";

// 로그인을 성공했을때 기본 요청 헤더에 Authorization 추가
export function addAuthHeader(accessToken) {
    axios.defaults.headers.common["Authorization"] = "Bearer " + accessToken;
}

// 로그아웃했을때 기본 요청 헤더에 Authorization 삭제
export function removeAuthHeader() {
    delete axios.defaults.headers.common["Authorization"];
}


function AxiosConfig() {
    return null;
}
export default AxiosConfig;