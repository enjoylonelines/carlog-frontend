'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StoriesBar from './components/StoriesBar/StoriesBar';
import HashtagBar from './components/HashtagBar/HashtagBar';
import PostCard from './components/PostCard/PostCard';
import { getHashtags } from '../api';
import { useFeedLoader } from './hooks/useFeedLoader';
import styles from './page.module.css';

export default function FeedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTag = searchParams.get('tag') || null;
  const keyword = searchParams.get('keyword') || '';

  const [hashtags, setHashtags] = useState([]);
  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);

  const { posts, isLoading, hasMore, sentinelRef } = useFeedLoader(selectedTag, keyword);

  const handleTagSelect = useCallback(
    (tag) => {
      const params = new URLSearchParams();
      if (tag) params.set('tag', tag);
      if (keyword) params.set('keyword', keyword);
      router.push(`/?${params.toString()}`);
    },
    [keyword, router],
  );

  return (
    <>
      <StoriesBar />
      {keyword && (
        <div className={styles.filterBanner}>
          <span>
            <b>{keyword}</b> 검색 결과
          </span>
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
        {posts.map((post) => (
          <PostCard key={post.boardId} post={post} />
        ))}
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
