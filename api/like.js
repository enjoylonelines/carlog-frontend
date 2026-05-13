import client from "./client";

export const createLike = async (boardId) => {
  const res = await client.post(`/api/likes/${boardId}`);
  return res?.data ?? null;
};

export const deleteLike = async (boardId) => {
  const res = await client.delete(`/api/likes/${boardId}`);
  return res?.data ?? null;
};
