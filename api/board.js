import client from './client';

const boardReadRequests = new Map();
const BOARD_READ_DEDUPE_MS = 1000;

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
  const now = Date.now();
  const cached = boardReadRequests.get(boardId);

  if (cached && now - cached.createdAt < BOARD_READ_DEDUPE_MS) {
    return cached.promise;
  }

  const promise = client.get(`/api/boards/read/${boardId}`).then((res) => res?.data ?? null);
  boardReadRequests.set(boardId, { promise, createdAt: now });

  promise.finally(() => {
    setTimeout(() => {
      const latest = boardReadRequests.get(boardId);
      if (latest?.promise === promise) {
        boardReadRequests.delete(boardId);
      }
    }, BOARD_READ_DEDUPE_MS);
  });

  return promise;
};

export const increaseBoardHit = async (boardId) => {
  await client.post(`/api/boards/hit/${boardId}`);
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
