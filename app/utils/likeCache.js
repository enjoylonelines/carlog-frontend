// 세션 내 좋아요 상태 공유 캐시 — PostCard ↔ BoardDetailPage 타이밍 불일치 방지
export const likeCache = {}; // { [boardId]: { liked: boolean, likes: number } }
