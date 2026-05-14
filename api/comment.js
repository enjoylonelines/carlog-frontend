import client from './client';

export const getComments = async (boardId, lastCommentId = null) => {
  const params = { boardId };
  if (lastCommentId) params.lastCommentId = lastCommentId;
  const res = await client.get('/api/comments', { params });
  return res?.data ?? { comments: [], hasNext: false, nextCursor: null };
};

export const getReplies = async (boardId, parentCommentId) => {
  const res = await client.get('/api/comments', { params: { boardId, parentCommentId } });
  return res?.data?.comments ?? [];
};

export const createComment = async ({ boardId, content, parentCommentId = null }) => {
  const res = await client.post('/api/comments', { boardId, content, parentCommentId });
  return res?.data ?? null;
};

export const deleteComment = async (commentId) => {
  const res = await client.delete(`/api/comments/${commentId}`);
  return res?.data ?? null;
};

export const updateComment = async (commentId, content) => {
  const res = await client.put(`/api/comments/${commentId}`, { content });
  return res?.data ?? null;
};
