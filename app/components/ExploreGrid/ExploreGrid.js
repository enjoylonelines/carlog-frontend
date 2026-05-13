'use client';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HashtagBar from '../HashtagBar/HashtagBar';
import { getHashtags, getExploreBoards } from '../../../api';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import styles from './ExploreGrid.module.css';

// 모듈 레벨 캐시
let _cachedItems = [];
let _cachedHasNext = true;
let _cachedPage = 1;

export default function ExploreGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag') || null;

  const restoreScroll = useScrollRestore('scroll_explore');

  const [hashtags, setHashtags] = useState([]);
  const [items, setItems] = useState(_cachedItems);
  const [hasNext, setHasNext] = useState(_cachedHasNext);
  const [loading, setLoading] = useState(false);

  const pageRef = useRef(_cachedPage);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const scrollRestoredRef = useRef(false);
  const scrollPendingRef = useRef(false);

  // 캐시된 items가 있을 때만 페인트 전 즉시 복원 — 없으면 loadMore 후 scrollPendingRef로 처리
  useLayoutEffect(() => {
    if (_cachedItems.length > 0 && !selectedTag && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      restoreScroll();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);

  const loadMore = useCallback(async (page, append) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    const data = await getExploreBoards(page);
    isLoadingRef.current = false;
    setLoading(false);

    const boards = data?.boards ?? [];
    setItems((prev) => {
      const next = append ? [...prev, ...boards] : boards;
      _cachedItems = next;
      return next;
    });
    const more = data?.hasNext ?? false;
    setHasNext(more);
    _cachedHasNext = more;
    _cachedPage = page;
    pageRef.current = page;

    if (!append && !selectedTag && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      scrollPendingRef.current = true;
    }
  }, [restoreScroll, selectedTag]);

  useEffect(() => {
    if (_cachedItems.length > 0) return;
    loadMore(1, false);
  }, [loadMore]);

  // items가 DOM에 반영된 후 pending 스크롤 복원 실행 (새로고침 포함)
  useEffect(() => {
    if (scrollPendingRef.current && items.length > 0) {
      scrollPendingRef.current = false;
      restoreScroll();
    }
  }, [items, restoreScroll]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current && hasNext) {
          loadMore(pageRef.current + 1, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadMore, items.length]);

  const handleTagSelect = useCallback((tag) => {
    if (tag === selectedTag) {
      router.replace('/explore', { scroll: false });
    } else {
      router.replace(`/explore?tag=${encodeURIComponent(tag)}`, { scroll: false });
    }
  }, [selectedTag, router]);

  const displayed = selectedTag
    ? items.filter((b) => b.hashtags?.includes(selectedTag))
    : items;

  return (
    <>
      <HashtagBar hashtags={hashtags} selected={selectedTag} onSelect={handleTagSelect} />
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {displayed.map((board) => {
            const imageUrl = board.mediaUrls?.[0] || '/no-image.svg';
            const tag = board.hashtags?.[0];
            return (
              <button
                key={board.boardId}
                className={styles.cell}
                onClick={() => router.push(`/boards/${board.boardId}`)}
              >
                <img
                  src={imageUrl}
                  alt={tag ? `#${tag}` : '게시물'}
                  className={styles.img}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = '/no-image.svg'; }}
                />
                <div className={styles.overlay}>
                  {tag && <span className={styles.overlayTag}>#{tag}</span>}
                  <div className={styles.overlayStats}>
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" fill="rgba(0,0,0,0.4)" />
                      </svg>
                      {(board.hitcount || 0).toLocaleString()}
                    </span>
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {board.commentCount || 0}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {displayed.length === 0 && !loading && (
            <div className={styles.empty}>
              <span>🚗</span>
              <p>게시물이 없어요.</p>
            </div>
          )}
        </div>

        {loading && (
          <div className={styles.loadingRow}>
            <div className={styles.spinner} />
          </div>
        )}
        {hasNext && !selectedTag && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </>
  );
}
