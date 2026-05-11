import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn(`[API] ${err.config?.url}:`, err.message);
    return Promise.resolve(null);
  }
);

export default client;
