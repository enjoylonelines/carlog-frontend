import client from './client';

export const searchUsers = async (keyword) => {
  const res = await client.get('/api/users/search', { params: { keyword } });
  return res?.data ?? null;
};

export const getUserProfile = async (userId) => {
  const res = await client.get(`/api/users/${userId}`);
  return res?.data ?? null;
};

export const updateUserProfile = async (userId, { username, bio, profileImageUrl }) => {
  const res = await client.put(`/api/users/${userId}`, { username, bio, profileImageUrl });
  return res?.data ?? null;
};

export const uploadProfileImage = async (userId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await client.post(`/api/users/${userId}/profile-image`, formData);
  return res?.data?.profileImageUrl ?? null;
};

export const updateUserAccount = async (userId, payload) => {
  const res = await client.put(`/api/users/${userId}/account`, payload);
  return res?.data ?? null;
};

export const deleteUser = async (userId, immediate) => {
  await client.delete(`/api/users/${userId}`, { params: { immediate } });
};

export const checkLoginIdAvailable = async (userId, loginId) => {
  const res = await client.get(`/api/users/${userId}/check-loginid`, { params: { loginId } });
  return {
    available: res?.data?.available ?? false,
    message: res?.data?.message ?? "확인에 실패했습니다"
  };
};

export const checkEmailAvailable = async (userId, email) => {
  const res = await client.get(`/api/users/${userId}/check-email`, { params: { email } });
  return {
    available: res?.data?.available ?? false,
    message: res?.data?.message ?? "확인에 실패했습니다"
  };
};
