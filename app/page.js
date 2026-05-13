'use client';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StoriesBar from './components/StoriesBar/StoriesBar';
import HashtagBar from './components/HashtagBar/HashtagBar';
import PostCard from './components/PostCard/PostCard';
import { getHashtags, searchBoards } from '../api';
import { useScrollRestore } from './hooks/useScrollRestore';
import { avatarColor } from './utils/avatar';
import styles from './page.module.css';

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
  imageUrl: board.mediaUrls?.[0] || '/no-image.svg',
  isLike: board.isLike,
  likeCount: board.likecount,
});

// 모듈 레벨 캐시 — 네비게이션 간 posts 유지
let _cachedPosts = [];
let _cachedHasMore = true;
let _cachedPage = 1;

export default function FeedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTag = searchParams.get('tag') || null;
  const keyword = searchParams.get('keyword') || '';

  const restoreScroll = useScrollRestore('scroll_feed');

  const [hashtags, setHashtags] = useState([]);
  // 초기값을 모듈 캐시에서 가져와 첫 렌더부터 콘텐츠 표시
  const [posts, setPosts] = useState(_cachedPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(_cachedHasMore);

  const pageRef = useRef(_cachedPage);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const scrollRestoredRef = useRef(false);
  const scrollPendingRef = useRef(false);


  // 캐시된 posts가 있을 때만 페인트 전 즉시 복원 — 없으면 loadBoards 후 scrollPendingRef로 처리
  useLayoutEffect(() => {
    if (_cachedPosts.length > 0 && !scrollRestoredRef.current && !selectedTag && !keyword) {
      scrollRestoredRef.current = true;
      restoreScroll();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);


  const loadBoards = useCallback(async (pageNo, append) => {
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
        const next = append ? [...prev, ...mapped] : mapped;
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

    // 첫 로드 완료 후 스크롤 복원 — posts DOM 반영 후 실행되도록 pending 플래그
    if (!append && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      scrollPendingRef.current = true;
    }
  }, [selectedTag, keyword, restoreScroll]);

  useEffect(() => {
    // 댓글 등 변이 후 스탈 플래그가 있으면 캐시 무효화
    if (sessionStorage.getItem('feed_stale')) {
      sessionStorage.removeItem('feed_stale');
      _cachedPosts = [];
    }
    if (!selectedTag && !keyword && _cachedPosts.length > 0) return;
    scrollRestoredRef.current = false;
    _cachedPosts = [];
    pageRef.current = 1;
    loadBoards(1, false);
  }, [loadBoards, selectedTag, keyword]);


  // posts가 DOM에 반영된 후 pending 스크롤 복원 실행 (새로고침 포함)
  useEffect(() => {
    if (scrollPendingRef.current && posts.length > 0) {
      scrollPendingRef.current = false;
      restoreScroll();
    }
  }, [posts, restoreScroll]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current && hasMore) {
          loadBoards(pageRef.current + 1, true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadBoards, posts.length]);

  const handleTagSelect = useCallback((tag) => {
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (keyword) params.set('keyword', keyword);
    router.push(`/?${params.toString()}`);
  }, [keyword, router]);


  return (
    <>
      <StoriesBar />
      {keyword && (
        <div className={styles.filterBanner}>
          <span><b>{keyword}</b> 검색 결과</span>
          <button
            className={styles.clearBtn}
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedTag) params.set('tag', selectedTag);
              router.push(`/?${params.toString()}`);
            }}
          >
            ✕
          </button>
        </div>
      )}
      <HashtagBar hashtags={hashtags} selected={selectedTag} onSelect={handleTagSelect} />
      <div className={styles.feed}>
        {posts.map((post) => <PostCard key={post.boardId} post={post} />)}
        {isLoading && (
          <div className={styles.state}>
            <div className={styles.spinner} />
            <span>불러오는 중...</span>
          </div>
        )}
        {!isLoading && posts.length === 0 && (
          <div className={styles.state}>
            <span className={styles.emptyIcon}>🚗</span>
            <p>게시물이 없어요.</p>
          </div>
        )}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </>
  );
}
