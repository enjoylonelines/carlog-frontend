'use client';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { searchBoards, getBoard } from '../../api';
import { useScrollRestore } from './useScrollRestore';
import { avatarColor } from '../utils/avatar';
import { clearFeedStale, isFeedStale } from '../utils/feedRefresh';
import { onFeedEvent } from '../utils/feedEventBus';

const mapBoard = (board) => ({
  boardId: board.boardId,
  userId: board.userId,
  username: board.username || `user${board.userId}`,
  avatarColor: avatarColor(board.userId),
  profileImageUrl: board.profileImageUrl || null,
  content: board.content || '',
  hitcount: board.hitcount,
  createdAt: board.createdDate,
  tags: board.hashtags || [],
  commentCount: board.commentCount ?? 0,
  mediaUrls: board.mediaUrls || [],
  mediaBackupUrls: board.mediaBackupUrls || [],
  imageUrl: board.mediaUrls?.[0] || '/no-image.svg',
  isLike: board.isLike,
  likeCount: board.likecount,
});

let _cachedPosts = [];
let _cachedHasMore = true;
let _cachedPage = 1;

export function useFeedLoader(selectedTag, keyword) {
  const restoreScroll = useScrollRestore('scroll_feed');

  const [posts, setPosts] = useState(_cachedPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(_cachedHasMore);

  const pageRef = useRef(_cachedPage);
  const isLoadingRef = useRef(false);
  const refreshTimerRef = useRef(null);
  const refreshFeedRef = useRef(null);
  const sentinelRef = useRef(null);
  const scrollRestoredRef = useRef(false);
  const scrollPendingRef = useRef(false);

  // 캐시된 posts가 있을 때 페인트 전 즉시 스크롤 복원 (깜빡임 방지)
  useLayoutEffect(() => {
    if (_cachedPosts.length > 0 && !scrollRestoredRef.current && !selectedTag && !keyword) {
      scrollRestoredRef.current = true;
      restoreScroll();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 페이지 단위 게시물 API 호출 및 모듈 캐시 갱신
  const loadBoards = useCallback(
    async (pageNo, append) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      if (!append) setHasMore(true);

      const data = await searchBoards({ pageNo, tag: selectedTag || '', keyword });
      isLoadingRef.current = false;
      setIsLoading(false);

      const boards = data?.boards;
      if (boards?.length) {
        const mapped = boards.map(mapBoard);
        setPosts((prev) => {
          const merged = append ? [...prev, ...mapped] : mapped;
          const seen = new Set();
          const next = merged.filter((p) => {
            if (seen.has(p.boardId)) return false;
            seen.add(p.boardId);
            return true;
          });
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
        const more = pageNo < (data.pager?.totalPageNo ?? 1);
        setHasMore(more);
        if (!selectedTag && !keyword) {
          _cachedHasMore = more;
          _cachedPage = pageNo;
        }
      } else {
        if (!append) {
          setPosts([]);
          if (!selectedTag && !keyword) _cachedPosts = [];
        }
        setHasMore(false);
        if (!selectedTag && !keyword) _cachedHasMore = false;
      }
      pageRef.current = pageNo;

      if (!append && !scrollRestoredRef.current) {
        scrollRestoredRef.current = true;
        scrollPendingRef.current = true;
      }
    },
    [selectedTag, keyword],
  );

  // 캐시 초기화 후 1페이지부터 강제 재로드 (게시물 등록·삭제 후 호출)
  const refreshFeed = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (isLoadingRef.current) {
      refreshTimerRef.current = window.setTimeout(() => {
        refreshFeedRef.current?.();
      }, 50);
      return;
    }
    clearFeedStale();
    _cachedPosts = [];
    _cachedHasMore = true;
    _cachedPage = 1;
    pageRef.current = 1;
    scrollRestoredRef.current = true;
    scrollPendingRef.current = false;
    setPosts([]);
    setHasMore(true);
    loadBoards(1, false);
  }, [loadBoards]);

  // refreshFeed 최신 참조 유지 (타이머 내 stale closure 방지)
  useEffect(() => {
    refreshFeedRef.current = refreshFeed;
  }, [refreshFeed]);

  // 초기 로드 및 태그·키워드 변경 시 재로드, stale 플래그 확인
  useEffect(() => {
    if (isFeedStale()) {
      refreshFeed();
      return;
    }
    if (!selectedTag && !keyword && _cachedPosts.length > 0) return;
    scrollRestoredRef.current = false;
    _cachedPosts = [];
    pageRef.current = 1;
    const timer = window.setTimeout(() => {
      loadBoards(1, false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBoards, refreshFeed, selectedTag, keyword]);

  // 언마운트 시 pending 타이머 정리
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshFeed]);

  // SSE 이벤트 기반 피드 카드 실시간 업데이트 (좋아요·댓글·조회수·삭제 등)
  useEffect(() => {
    return onFeedEvent(async ({ type, boardId }) => {
      if (type === 'NEW_POST') {
        if (_cachedPosts.some((p) => p.boardId === boardId)) return;
        const data = await getBoard(boardId);
        if (!data) return;
        const newPost = mapBoard(data);
        setPosts((prev) => {
          if (prev.some((p) => p.boardId === boardId)) return prev;
          const next = [newPost, ...prev];
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      } else if (type === 'LIKE') {
        setPosts((prev) => {
          const next = prev.map((p) => (p.boardId === boardId ? { ...p, likeCount: (p.likeCount ?? 0) + 1 } : p));
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      } else if (type === 'UNLIKE') {
        setPosts((prev) => {
          const next = prev.map((p) =>
            p.boardId === boardId ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) - 1) } : p,
          );
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      } else if (type === 'COMMENT') {
        setPosts((prev) => {
          const next = prev.map((p) => (p.boardId === boardId ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p));
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      } else if (type === 'COMMENT_DELETED') {
        setPosts((prev) => {
          const next = prev.map((p) =>
            p.boardId === boardId ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 0) - 1) } : p,
          );
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      } else if (type === 'BOARD_DELETED') {
        setPosts((prev) => {
          const next = prev.filter((p) => p.boardId !== boardId);
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      } else if (type === 'BOARD_SAVED') {
        refreshFeed();
      } else if (type === 'BOARD_VIEWED') {
        setPosts((prev) => {
          const next = prev.map((p) => (p.boardId === boardId ? { ...p, hitcount: (p.hitcount || 0) + 1 } : p));
          if (!selectedTag && !keyword) _cachedPosts = next;
          return next;
        });
      }
    });
  }, [selectedTag, keyword, refreshFeed]);

  // 첫 API 로드 완료 후 posts DOM 반영된 시점에 스크롤 복원
  useEffect(() => {
    if (scrollPendingRef.current && posts.length > 0) {
      scrollPendingRef.current = false;
      restoreScroll();
    }
  }, [posts, restoreScroll]);

  // sentinel이 뷰포트에 진입하면 다음 페이지 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current && hasMore) {
          loadBoards(pageRef.current + 1, true);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadBoards, posts.length]);

  return { posts, isLoading, hasMore, sentinelRef };
}
