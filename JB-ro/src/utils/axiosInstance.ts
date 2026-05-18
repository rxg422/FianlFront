import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081/api';

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰을 Authorization 헤더에 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 localStorage에서 제거하고 홈으로 리다이렉트
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/?loginError=' + encodeURIComponent('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
