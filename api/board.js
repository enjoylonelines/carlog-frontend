import client from './client';

export const searchBoards = async ({ pageNo = 1, tag = '', keyword = '', userId = null } = {}) => {
  const params = { pageNo };
  if (tag) params.tag = tag;
  if (keyword) params.keyword = keyword;
  if (userId != null) params.userId = userId;
  const res = await client.get('/api/boards/list', { params });
  return res?.data ?? null;
};

export const getBoard = async (boardId) => {
  const res = await client.get(`/api/boards/read/${boardId}`);
  return res?.data ?? null;
};

export const createBoard = async ({ userId = 1, content, hashtags = [], mediaFile = null }) => {
  const form = new FormData();
  form.append('userId', userId);
  form.append('content', content);
  hashtags.forEach((tag) => form.append('hashtags', tag));
  if (mediaFile) form.append('mediaFiles', mediaFile);
  const res = await client.post('/api/boards/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data ?? null;
};

export const updateBoard = async ({ boardId, content, hashtags = [], mediaFile = null }) => {
  const form = new FormData();
  form.append('boardId', boardId);
  form.append('content', content);
  hashtags.forEach((tag) => form.append('hashtags', tag));
  if (mediaFile) form.append('mediaFiles', mediaFile);
  const res = await client.put('/api/boards/update', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data ?? null;
};

export const deleteBoard = async (boardId) => {
  const res = await client.delete(`/api/boards/delete/${boardId}`);
  return res?.data ?? null;
};
