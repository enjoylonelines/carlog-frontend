const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';

async function request(path, options = {}) {
  try {
    const { headers: extraHeaders, body, ...rest } = options;
    const isFormData = body instanceof FormData;
    const headers = isFormData
      ? { ...extraHeaders }
      : { 'Content-Type': 'application/json', ...extraHeaders };

    const res = await fetch(`${BASE_URL}${path}`, {
      cache: 'no-store',
      ...rest,
      ...(body !== undefined ? { body } : {}),
      headers,
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

export const searchBoards = ({ pageNo = 1 } = {}) =>
  request(`/api/boards/list?pageNo=${pageNo}`);

export const searchUsers = (keyword) =>
  request(`/api/users/search?keyword=${encodeURIComponent(keyword)}`);

export const getUserProfile = (userId) =>
  request(`/api/users/${userId}`);

export const getFollowers = (userId) =>
  request(`/api/follows/followers/${userId}`);

export const getFollowings = (userId) =>
  request(`/api/follows/followings/${userId}`);

export const getBoard = (boardId) =>
  request(`/api/boards/read/${boardId}`);

export const createBoard = ({ userId = 1, content, hashtags = [], mediaFile = null }) => {
  const form = new FormData();
  form.append('userId', userId);
  form.append('content', content);
  hashtags.forEach((tag) => form.append('hashtags', tag));
  if (mediaFile) form.append('mediaFiles', mediaFile);
  return request('/api/boards/create', { method: 'POST', body: form });
};

export const updateBoard = ({ boardId, content, hashtags = [], mediaFile = null }) => {
  const form = new FormData();
  form.append('boardId', boardId);
  form.append('content', content);
  hashtags.forEach((tag) => form.append('hashtags', tag));
  if (mediaFile) form.append('mediaFiles', mediaFile);
  return request('/api/boards/update', { method: 'PUT', body: form });
};

export const deleteBoard = (boardId) =>
  request(`/api/boards/delete/${boardId}`, { method: 'DELETE' });

export const getComments = (boardId) =>
  request(`/api/comments?boardId=${boardId}`).then((data) => data?.comments ?? []);

export const createComment = ({ boardId, content, parentCommentId = null }) =>
  request('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ boardId, content, parentCommentId }),
  });

export const deleteComment = (commentId) =>
  request(`/api/comments/${commentId}`, { method: 'DELETE' });

export const getReplies = (boardId, parentCommentId) =>
  request(`/api/comments?boardId=${boardId}&parentCommentId=${parentCommentId}`).then((data) => data?.comments ?? []);

// 계정 관리
export const deleteUser = (userId, immediate = false) =>
  request(`/api/users/${userId}?immediate=${immediate}`, { method: 'DELETE' });

export const updateUserAccount = (userId, data) =>
  request(`/api/users/${userId}/account`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const checkLoginIdAvailable = (userId, loginId) =>
  request(`/api/users/${userId}/check-loginid?loginId=${encodeURIComponent(loginId)}`);

export const checkEmailAvailable = (userId, email) =>
  request(`/api/users/${userId}/check-email?email=${encodeURIComponent(email)}`);
