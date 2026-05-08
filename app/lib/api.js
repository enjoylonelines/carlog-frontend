const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';

async function request(path, options) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : true;
  } catch (err) {
    console.warn(`[API] ${path}:`, err.message);
    return null;
  }
}

export const getHashtags = (name = '') =>
  request(`/api/hashtags${name ? `?name=${encodeURIComponent(name)}` : ''}`);

export const searchBoards = ({ tag, keyword } = {}) => {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (keyword) params.set('keyword', keyword);
  return request(`/api/boards/search?${params}`);
};

export const searchUsers = (keyword) =>
  request(`/api/users/search?keyword=${encodeURIComponent(keyword)}`);

export const getUserProfile = (userId) =>
  request(`/api/users/${userId}`);

export const getFollowers = (userId) =>
  request(`/api/follows/followers/${userId}`);

export const getFollowings = (userId) =>
  request(`/api/follows/followings/${userId}`);

export const getBoard = (boardId) =>
  request(`/api/boards/${boardId}`);

export const createBoard = ({ userId, content, tags = [] }) =>
  request('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ userId, content, tags }),
  });

export const updateBoard = ({ boardId, content, tags = [] }) =>
  request(`/api/boards/${boardId}`, {
    method: 'PUT',
    body: JSON.stringify({ content, tags }),
  });

export const deleteBoard = (boardId) =>
  request(`/api/boards/${boardId}`, { method: 'DELETE' });

export const getComments = (boardId) =>
  request(`/api/comments?boardId=${boardId}`);

export const createComment = ({ boardId, userId, content, parentCommentId = null }) =>
  request('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ boardId, userId, content, parentCommentId }),
  });

export const deleteComment = (commentId) =>
  request(`/api/comments/${commentId}`, { method: 'DELETE' });

export const getReplies = (parentCommentId) =>
  request(`/api/comments/${parentCommentId}/replies`);
