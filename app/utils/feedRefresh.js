import { emitFeedEvent } from './feedEventBus';

export const FEED_STALE_KEY = 'feed_stale';

export function markFeedStale() {
  sessionStorage.setItem(FEED_STALE_KEY, '1');
  emitFeedEvent({ type: 'BOARD_SAVED' });
}

export function clearFeedStale() {
  sessionStorage.removeItem(FEED_STALE_KEY);
}

export function isFeedStale() {
  return sessionStorage.getItem(FEED_STALE_KEY) === '1';
}

export function markBoardViewed(boardId) {
  emitFeedEvent({ type: 'BOARD_VIEWED', boardId: Number(boardId) });
}
