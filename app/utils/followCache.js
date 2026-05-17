// 세션 내 팔로우 상태 공유 캐시 — PostCard와 UserProfileView가 함께 사용
export const followCache = {};

const followListeners = new Set();
export function emitFollowEvent(event) {
  followListeners.forEach((fn) => fn(event));
}
export function onFollowEvent(fn) {
  followListeners.add(fn);
  return () => followListeners.delete(fn);
}
