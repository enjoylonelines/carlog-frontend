import axios from 'axios';

const PRIMARY = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
const SECONDARY = 'http://192.168.5.53';

const primary = axios.create({ baseURL: PRIMARY });
const secondary = axios.create({ baseURL: SECONDARY });

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

    // GET/변이 모두 primary만 시도, 실패 시 secondary로 폴백
    let result = null;
    try {
      result = await primary.request(config);
    } catch {
      try {
        result = await secondary.request(config);
      } catch {
        result = null;
      }
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

  get(url, config)        { return this.request({ ...config, method: 'get',    url }); },
  post(url, data, config) { return this.request({ ...config, method: 'post',   url, data }); },
  put(url, data, config)  { return this.request({ ...config, method: 'put',    url, data }); },
  delete(url, config)     { return this.request({ ...config, method: 'delete', url }); },
};

export default client;
