export const FEED_STALE_KEY = "feed_stale";
export const BOARD_SAVED_EVENT = "carlog:board-saved";
export const BOARD_DELETED_EVENT = "carlog:board-deleted";

export function markFeedStale(eventName = BOARD_SAVED_EVENT) {
  sessionStorage.setItem(FEED_STALE_KEY, "1");
  window.dispatchEvent(new Event(eventName));
}

export function clearFeedStale() {
  sessionStorage.removeItem(FEED_STALE_KEY);
}

export function isFeedStale() {
  return sessionStorage.getItem(FEED_STALE_KEY) === "1";
}
