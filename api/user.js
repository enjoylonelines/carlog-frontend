import client from './client';

export const searchUsers = async (keyword) => {
  const res = await client.get('/api/users/search', { params: { keyword } });
  return res?.data ?? null;
};

export const getUserProfile = async (userId) => {
  const res = await client.get(`/api/users/${userId}`);
  return res?.data ?? null;
};
