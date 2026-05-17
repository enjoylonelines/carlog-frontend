'use client';
import { useRef, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PostCard.module.css';
import { AuthContext } from '../../../contexts/AuthContext';
import { checkFollow, followUser, unfollowUser, increaseBoardHit } from '../../../api';
import { avatarColor as getAvatarColor } from '../../utils/avatar';
import { followCache } from '../../utils/followCache';
import { likeCache } from '../../utils/likeCache';
import { isMediaSrc, toMediaSrc, useBackupImageOnError, useFetchedImage } from '../../utils/mediaFallback';
import FetchedAvatar from '../FetchedAvatar/FetchedAvatar';
import { markBoardViewed } from '../../utils/feedRefresh';
import { createLike, deleteLike } from '@/api/like';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const toAbsUrl = (url) => (url && url.startsWith('/') ? `${API_BASE}${url}` : url);

function FetchedImage({ url, backupUrl, alt, className, loading }) {
  const src = useFetchedImage(url || backupUrl);
  if (src === null)
    return (
      <div className="imgSkeleton">
        <span className="imgSkeletonIcon" />
      </div>
    );
  return <img src={src === 'ERROR' ? '/no-image.svg' : src} alt={alt} className={className} loading={loading} />;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function PostCard({ post }) {
  const router = useRouter();
  const { userId: MY_USER_ID, setShowLoginModal, setRedirectUrl } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const mediaListRef = useRef(null);

  const {
    boardId,
    userId,
    username,
    avatarColor,
    profileImageUrl,
    content,
    hitcount,
    createdAt,
    tags,
    imageUrl,
    mediaUrls,
    mediaBackupUrls,
    commentCount,
    isLike,
    likeCount,
  } = post;
  const images = mediaUrls?.length ? mediaUrls : imageUrl ? [imageUrl] : [];
  const backupImages = mediaBackupUrls || [];
  const color = avatarColor || getAvatarColor(userId);
  const isLong = content && content.length > 80;
  const isOwnPost = userId === MY_USER_ID;


  // null = 로딩 중, true/false = 확정
  const [following, setFollowing] = useState(() => followCache[userId] ?? null);

  // 좋아요 — prop 변경 감지 + likeCache 우선 적용
  const [{ prevIsLike, prevLikeCount, liked, likes }, setLikeState] = useState(() => {
    const cached = likeCache[boardId];
    return {
      prevIsLike: isLike ?? 0,
      prevLikeCount: likeCount ?? 0,
      liked: cached ? cached.liked : (isLike ?? 0) === 1,
      likes: cached ? cached.likes : (likeCount ?? 0),
    };
  });

  if ((isLike ?? 0) !== prevIsLike || (likeCount ?? 0) !== prevLikeCount) {
    const cached = likeCache[boardId];
    setLikeState({
      prevIsLike: isLike ?? 0,
      prevLikeCount: likeCount ?? 0,
      liked: cached ? cached.liked : (isLike ?? 0) === 1,
      likes: cached ? cached.likes : (likeCount ?? 0),
    });
  }

  const likeDebounceRef = useRef(null);
  const likeTargetRef = useRef(null);

  useEffect(() => {
    if (!MY_USER_ID) return;
    if (isOwnPost) return;
    if (followCache[userId] !== undefined) return;
    let cancelled = false;
    checkFollow({ userId: MY_USER_ID, targetId: userId }).then((isFollowing) => {
      if (!cancelled) {
        followCache[userId] = isFollowing;
        setFollowing(isFollowing);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [MY_USER_ID, userId, isOwnPost]);

  const handleFollow = async () => {
    if (!MY_USER_ID) return;
    const next = !following;
    setFollowing(next);
    followCache[userId] = next;
    if (next) {
      await followUser({ userId: MY_USER_ID, targetId: userId });
    } else {
      await unfollowUser({ userId: MY_USER_ID, targetId: userId });
    }
  };

  const handleMediaScroll = () => {
    const list = mediaListRef.current;
    if (!list) return;
    const nextIndex = Math.round(list.scrollLeft / list.clientWidth);
    setCurrentMediaIndex(Math.min(Math.max(nextIndex, 0), images.length - 1));
  };

  const moveMedia = (event, direction) => {
    event.stopPropagation();
    const list = mediaListRef.current;
    if (!list) return;
    const nextIndex = Math.min(Math.max(currentMediaIndex + direction, 0), images.length - 1);
    list.scrollTo({
      left: nextIndex * list.clientWidth,
      behavior: 'smooth',
    });
    setCurrentMediaIndex(nextIndex);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (!MY_USER_ID) {
      setShowLoginModal(true);
      return;
    }

    // UI 즉시 토글 (functional update로 연속 클릭도 정확히 반영)
    setLikeState((prev) => {
      const nextLiked = !prev.liked;
      const nextLikes = nextLiked ? prev.likes + 1 : prev.likes - 1;
      likeTargetRef.current = nextLiked;
      likeCache[boardId] = { liked: nextLiked, likes: nextLikes };
      return { ...prev, liked: nextLiked, likes: nextLikes };
    });

    // 마지막 클릭 600ms 후 API 1회 호출
    clearTimeout(likeDebounceRef.current);
    likeDebounceRef.current = setTimeout(async () => {
      const targetLiked = likeTargetRef.current;
      try {
        const res = targetLiked ? await createLike(boardId) : await deleteLike(boardId);
        if (res) {
          const confirmed = { liked: (res.isLiked ?? 0) === 1, likes: res.likeCount ?? 0 };
          setLikeState((prev) => ({ ...prev, ...confirmed }));
          likeCache[boardId] = confirmed;
        }
      } catch (err) {
        console.error('좋아요 처리 실패', err);
        setLikeState((prev) => {
          const revertLiked = !targetLiked;
          const revertLikes = revertLiked ? prev.likes + 1 : prev.likes - 1;
          likeCache[boardId] = { liked: revertLiked, likes: revertLikes };
          return { ...prev, liked: revertLiked, likes: revertLikes };
        });
      }
    }, 600);
  };

  const openBoard = async () => {
    if (!MY_USER_ID) {
      setRedirectUrl(`/boards/${boardId}`);
      setShowLoginModal(true);
      return;
    }
    try {
      await increaseBoardHit(boardId);
      markBoardViewed(boardId);
    } finally {
      router.push(`/boards/${boardId}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const goToBoard = async () => {
    try {
      await increaseBoardHit(boardId);
      markBoardViewed(boardId);
    } finally {
      closeModal();
      router.push(`/boards/${boardId}`);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div
          className={styles.avatarWrap}
          onClick={() => router.push(userId === MY_USER_ID ? '/profile' : `/users/${userId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push(userId === MY_USER_ID ? '/profile' : `/users/${userId}`)}
        >
          <FetchedAvatar
            src={profileImageUrl}
            fallbackChar={(username || 'U')[0].toUpperCase()}
            fallbackColor={color}
            className={styles.avatarImg}
          />
        </div>
        <div
          className={styles.meta}
          onClick={() => router.push(userId === MY_USER_ID ? '/profile' : `/users/${userId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push(userId === MY_USER_ID ? '/profile' : `/users/${userId}`)}
        >
          <span className={styles.username}>{username || '알 수 없음'}</span>
          <span className={styles.time}>{timeAgo(createdAt)}</span>
        </div>
        {MY_USER_ID && !isOwnPost && following !== null && (
          <button className={`${styles.followBtn} ${following ? styles.following : ''}`} onClick={handleFollow}>
            {following ? '팔로잉' : '팔로우'}
          </button>
        )}
      </div>

      <div
        className={styles.cardLink}
        onClick={openBoard}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') openBoard();
        }}
      >
        {images.length > 0 && (
          <div className={styles.mediaFrame}>
            <div className={styles.mediaList} ref={mediaListRef} onScroll={handleMediaScroll}>
              {images.map((url, index) => (
                <div className={styles.imageWrap} key={`${url}-${index}`}>
                  <FetchedImage
                    url={url}
                    backupUrl={backupImages[index]}
                    alt={`${username} 게시물 이미지 ${index + 1}`}
                    className={styles.image}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.mediaArrow} ${styles.mediaArrowPrev}`}
                  onClick={(event) => moveMedia(event, -1)}
                  disabled={currentMediaIndex === 0}
                  aria-label="Previous image"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.mediaArrow} ${styles.mediaArrowNext}`}
                  onClick={(event) => moveMedia(event, 1)}
                  disabled={currentMediaIndex === images.length - 1}
                  aria-label="Next image"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        <div className={styles.body}>
          {tags && tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {content && (
            <p className={styles.content}>
              {!expanded && isLong ? (
                <>
                  {content.slice(0, 80)}
                  {'... '}
                  <button
                    className={styles.moreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(true);
                    }}
                  >
                    더보기
                  </button>
                </>
              ) : (
                content
              )}
            </p>
          )}

          <div className={styles.stats}>
            {/* 좋아요 버튼  */}
            {MY_USER_ID ? (
              <button className={styles.stat} onClick={handleLike}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={liked ? '#ef4444' : 'none'}
                  stroke={liked ? '#ef4444' : 'currentColor'}
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likes.toLocaleString()}
              </button>
            ) : (
              <span className={styles.stat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likes.toLocaleString()}
              </span>
            )}
            <span className={styles.stat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {(hitcount || 0).toLocaleString()}
            </span>
            <span className={styles.stat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {(commentCount || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
