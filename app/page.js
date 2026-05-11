"use client";
import { useReducer, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StoriesBar from "./components/StoriesBar/StoriesBar";
import HashtagBar from "./components/HashtagBar/HashtagBar";
import PostCard from "./components/PostCard/PostCard";
import { getHashtags, searchBoards } from "../api";
import styles from "./page.module.css";

const AVATAR_COLORS = ['#E03131', '#2F9E44', '#1971C2', '#F08C00', '#7048E8', '#4ECDC4'];
function avatarColor(userId) {
  return AVATAR_COLORS[(userId || 0) % AVATAR_COLORS.length];
}

export default function FeedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTag = searchParams.get("tag") || null;
  const keyword = searchParams.get("keyword") || "";

  const [{ loading, hashtags, posts }, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "setHashtags": return { ...state, hashtags: action.hashtags };
        case "loading":     return { ...state, loading: true };
        case "success":     return { ...state, loading: false, posts: action.posts };
        case "error":       return { ...state, loading: false, posts: [] };
        default:            return state;
      }
    },
    { loading: false, hashtags: [], posts: null }
  );

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) dispatch({ type: "setHashtags", hashtags: data });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });

    searchBoards({ tag: selectedTag || '', keyword }).then((data) => {
      if (cancelled) return;
      const boards = data?.boards;
      if (boards && Array.isArray(boards) && boards.length > 0) {
        const mapped = boards.map((board) => ({
          boardId: board.boardId,
          userId: board.userId,
          username: board.username || `user${board.userId}`,
          avatarColor: avatarColor(board.userId),
          content: board.content || '',
          hitcount: board.hitcount,
          createdAt: board.createdDate,
          tags: board.hashtags || [],
          commentCount: board.commentCount ?? 0,
          imageUrl: board.mediaUrls?.[0] || null,
        }));
        dispatch({ type: "success", posts: mapped });
      } else {
        dispatch({ type: "error" });
      }
    });

    return () => { cancelled = true; };
  }, [selectedTag, keyword]);

  const handleTagSelect = useCallback((tag) => {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (keyword) params.set("keyword", keyword);
    router.push(`/?${params.toString()}`);
  }, [keyword, router]);

  const displayPosts = posts === null ? [] : posts;

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
              if (selectedTag) params.set("tag", selectedTag);
              router.push(`/?${params.toString()}`);
            }}
          >
            ✕
          </button>
        </div>
      )}
      <HashtagBar hashtags={hashtags} selected={selectedTag} onSelect={handleTagSelect} />
      <div className={styles.feed}>
        {loading ? (
          <div className={styles.state}>
            <div className={styles.spinner} />
            <span>불러오는 중...</span>
          </div>
        ) : displayPosts.length > 0 ? (
          displayPosts.map((post) => <PostCard key={post.boardId} post={post} />)
        ) : (
          <div className={styles.state}>
            <span className={styles.emptyIcon}>🚗</span>
            <p>게시물이 없어요.</p>
          </div>
        )}
      </div>
    </>
  );
}
