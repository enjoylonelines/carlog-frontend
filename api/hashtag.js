import client from './client';

export const getHashtags = async (name = '') => {
  const res = await client.get('/api/hashtags', { params: name ? { name } : {} });
  return res?.data ?? null;
};
