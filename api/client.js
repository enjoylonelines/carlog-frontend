import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const instance = axios.create({ baseURL: BASE_URL });

instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 응답 인터셉터: 토큰 만료 시 강제 로그아웃 후 로그인 페이지로 이동
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// GET 응답 메모리 캐시 (TTL 없음 — 변이 요청 시 무효화)
const cache = new Map();

function getCacheKey(url, params) {
  return url + (params ? '?' + new URLSearchParams(params).toString() : '');
}

const client = {
  async request(config) {
    const isGet = config.method === 'get';
    const cacheKey = isGet ? getCacheKey(config.url, config.params) : null;

    if (isGet && cacheKey && cache.has(cacheKey)) {
      return cache.get(cacheKey).data;
    }

    let result = null;
    try {
      result = await instance.request(config);
    } catch {
      result = null;
    }

    if (!result) return null;

    if (isGet && cacheKey) {
      cache.set(cacheKey, { data: result, ts: Date.now() });
    }

    // 변이 요청 후 관련 캐시 무효화
    if (!isGet) {
      this._invalidateRelated(config.url);
    }

    return result;
  },

  // 변이된 URL과 관련된 캐시 항목 삭제
  _invalidateRelated(mutatedUrl) {
    const base = '/' + mutatedUrl.split('/').slice(1, 3).join('/');
    // 댓글 변이 시 boards 캐시도 함께 무효화
    const bases = base.startsWith('/api/comments')
      ? [base, '/api/boards']
      : base.startsWith('/api/follows')
        ? [base, '/api/users']
        : base.startsWith('/api/users')
          ? [base, '/api/boards']
          : [base];
    for (const key of cache.keys()) {
      if (bases.some((b) => key.startsWith(b))) cache.delete(key);
    }
  },

  // 수동 무효화
  invalidate(urlPrefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(urlPrefix)) cache.delete(key);
    }
  },

  get(url, config) {
    return this.request({ ...config, method: 'get', url });
  },
  post(url, data, config) {
    return this.request({ ...config, method: 'post', url, data });
  },
  put(url, data, config) {
    return this.request({ ...config, method: 'put', url, data });
  },
  delete(url, config) {
    return this.request({ ...config, method: 'delete', url });
  },
};

export default client;
