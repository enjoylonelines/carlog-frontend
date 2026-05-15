'use client';

import axios from 'axios';
import { useEffect } from 'react';

axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;

export function addAuthHeader(accessToken) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
}

export function removeAuthHeader() {
  delete axios.defaults.headers.common['Authorization'];
}

function AxiosConfig() {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userId');
          removeAuthHeader();
          window.location.replace('/');
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return null;
}
export default AxiosConfig;
