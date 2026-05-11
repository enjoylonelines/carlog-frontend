import client from './client';

export const getFollowers = async (userId) => {
  const res = await client.get(`/api/follows/followers/${userId}`);
  return res?.data ?? null;
};

export const getFollowings = async (userId) => {
  const res = await client.get(`/api/follows/followings/${userId}`);
  return res?.data ?? null;
};

export const checkFollow = async ({ userId, targetId }) => {
  const res = await client.get('/api/follows/check', { params: { userId, targetId } });
  return res?.data?.following ?? false;
};

export const followUser = async ({ userId, targetId }) => {
  const res = await client.post('/api/follows', null, { params: { userId, targetId } });
  return res?.data ?? null;
};

export const unfollowUser = async ({ userId, targetId }) => {
  const res = await client.delete('/api/follows', { params: { userId, targetId } });
  return res?.data ?? null;
};
