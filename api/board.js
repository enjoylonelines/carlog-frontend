import client from './client';

export const getExploreBoards = async (page = 1, size = 18) => {
  const res = await client.get('/api/boards/explore', { params: { page, size } });
  return res?.data ?? { boards: [], hasNext: false };
};

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

export const createBoard = async ({ content, hashtags = [], mediaFiles = [] }) => {
  const form = new FormData();
  form.append('content', content);
  hashtags.forEach((tag) => form.append('hashtags', tag));
  mediaFiles.forEach((file) => form.append('mediaFiles', file));
  const res = await client.post('/api/boards/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data ?? null;
};

export const updateBoard = async ({ boardId, content, hashtags = [], mediaFiles = [] }) => {
  const form = new FormData();
  form.append('boardId', boardId);
  form.append('content', content);
  hashtags.forEach((tag) => form.append('hashtags', tag));
  mediaFiles.forEach((file) => form.append('mediaFiles', file));
  const res = await client.put('/api/boards/update', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data ?? null;
};

export const deleteBoard = async (boardId) => {
  const res = await client.delete(`/api/boards/delete/${boardId}`);
  return res?.data ?? null;
};
