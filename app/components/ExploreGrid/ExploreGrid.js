'use client';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HashtagBar from '../HashtagBar/HashtagBar';
import { getHashtags, getExploreBoards, searchBoards, increaseBoardHit } from '../../../api';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import { useFetchedImage } from '../../utils/mediaFallback';

function GridImage({ url, alt }) {
  const src = useFetchedImage(url);
  if (src === null) return <div className="imgSkeleton"><span className="imgSkeletonIcon" /></div>;
  return <img src={src === 'ERROR' ? '/no-image.svg' : src} alt={alt} className={styles.img} />;
}
import { markBoardViewed } from '../../utils/feedRefresh';
import styles from './ExploreGrid.module.css';

// 태그 없는 모드 전용 모듈 캐시 (스크롤 복원용)
let _cachedItems = [];
let _cachedHasNext = true;
let _cachedPage = 1;

export default function ExploreGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag') || null;

  const restoreScroll = useScrollRestore('scroll_explore');

  const [hashtags, setHashtags] = useState([]);
  const [{ prevTag, items, hasNext }, setGridState] = useState(() => ({
    prevTag: selectedTag,
    items: selectedTag ? [] : _cachedItems,
    hasNext: selectedTag ? true : _cachedHasNext,
  }));
  const [loading, setLoading] = useState(false);

  const selectedTagRef = useRef(selectedTag);
  selectedTagRef.current = selectedTag;

  const pageRef = useRef(selectedTag ? 1 : _cachedPage);
  const isLoadingRef = useRef(false);
  const loadGenRef = useRef(0); // 태그 변경 시 진행 중 요청 무효화
  const sentinelRef = useRef(null);
  const scrollRestoredRef = useRef(false);
  const scrollPendingRef = useRef(false);

  // 태그 변경 감지: render 중 즉시 items 리셋
  if (selectedTag !== prevTag) {
    loadGenRef.current += 1;
    isLoadingRef.current = false;
    setGridState({
      prevTag: selectedTag,
      items: selectedTag ? [] : _cachedItems,
      hasNext: selectedTag ? true : _cachedHasNext,
    });
    pageRef.current = selectedTag ? 1 : _cachedPage;
  }

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

  // loadMore는 항상 selectedTagRef.current로 최신 태그를 읽음 → deps 불필요
  const loadMore = useCallback(async (page, append) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    const gen = loadGenRef.current;
    const tag = selectedTagRef.current;

    let boards = [];
    let more = false;

    try {
      if (tag) {
        const data = await searchBoards({ tag, pageNo: page });
        boards = data?.boards ?? [];
        more = data?.hasNext ?? false;
      } else {
        const data = await getExploreBoards(page);
        boards = data?.boards ?? [];
        more = data?.hasNext ?? false;
      }
    } finally {
      if (gen === loadGenRef.current) {
        isLoadingRef.current = false;
        setLoading(false);
      }
    }

    // 태그가 바뀐 사이 응답이 온 경우 버림
    if (gen !== loadGenRef.current) return;

    setGridState((prev) => {
      const next = append ? [...prev.items, ...boards] : boards;
      if (!selectedTagRef.current) {
        _cachedItems = next;
        _cachedHasNext = more;
        _cachedPage = page;
      }
      return { ...prev, items: next, hasNext: more };
    });
    pageRef.current = page;

    if (!append && !selectedTagRef.current && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      scrollPendingRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // items가 비어 있을 때 로드 (초기 진입 or 태그 변경 후)
  useEffect(() => {
    if (items.length > 0) return;
    loadMore(1, false);
  }, [loadMore, items.length]);

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
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadMore, items.length]);

  const handleTagSelect = useCallback(
    (tag) => {
      if (tag === selectedTag) {
        router.replace('/explore', { scroll: false });
      } else {
        router.replace(`/explore?tag=${encodeURIComponent(tag)}`, { scroll: false });
      }
    },
    [selectedTag, router],
  );

  const openBoard = async (boardId) => {
    try {
      await increaseBoardHit(boardId);
      markBoardViewed(boardId);
      setGridState((prev) => {
        const next = prev.items.map((item) =>
          item.boardId === boardId ? { ...item, hitcount: (item.hitcount || 0) + 1 } : item,
        );
        if (!selectedTagRef.current) _cachedItems = next;
        return { ...prev, items: next };
      });
    } finally {
      router.push(`/boards/${boardId}`);
    }
  };

  return (
    <>
      <HashtagBar hashtags={hashtags} selected={selectedTag} onSelect={handleTagSelect} />
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {items.map((board) => {
            const imageUrl = board.mediaUrls?.[0];
            const tag = board.hashtags?.[0];
            return (
              <button
                key={board.boardId}
                className={styles.cell}
                onClick={() => openBoard(board.boardId)}
              >
                <GridImage url={imageUrl} alt={tag ? `#${tag}` : '게시물'} />
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

          {items.length === 0 && !loading && (
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
        {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </>
  );
}
