import client from './client';

export const getComments = async (boardId, page = 1, size = 15) => {
  const res = await client.get('/api/comments', { params: { boardId, page, size } });
  return res?.data ?? { comments: [], hasNext: false };
};

export const getReplies = async (boardId, parentCommentId) => {
  const res = await client.get('/api/comments', { params: { boardId, parentCommentId, size: 100 } });
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
