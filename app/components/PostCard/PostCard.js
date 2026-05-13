"use client";
import { useRef, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./PostCard.module.css";
import { AuthContext } from "../../../contexts/AuthContext";
import { checkFollow, followUser, unfollowUser } from "../../../api";
import { avatarColor as getAvatarColor } from "../../utils/avatar";
import { followCache } from "../../utils/followCache";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL;
const mediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function PostCard({ post }) {
  const router = useRouter();
  const { userId: MY_USER_ID } = useContext(AuthContext);
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
    commentCount,
    isLike,
    likeCount,
  } = post;
  const images = mediaUrls?.length ? mediaUrls : imageUrl ? [imageUrl] : [];
  const color = avatarColor || getAvatarColor(userId);
  const isLong = content && content.length > 80;
  const isOwnPost = userId === MY_USER_ID;

  // null = 로딩 중, true/false = 확정
  const [following, setFollowing] = useState(() => followCache[userId] ?? null);

  // 좋아요
  const [liked, setLiked] = useState(() => (isLike ?? 0) === 1);
  const [likes, setLikes] = useState(() => likeCount ?? 0);

  useEffect(() => {
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
  }, [userId, isOwnPost]);

  const handleFollow = async () => {
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
      behavior: "smooth",
    });
    setCurrentMediaIndex(nextIndex);
  };

  // 좋아요 이벤트
  const handleLike = async (e) => {
    e.stopPropagation();

    try {
      if (liked) {
        const res = await likeApi.deleteLike(boardId);

        setLiked((res.data.isLiked ?? 0) === 1);
        setLikes(res.data.likeCount ?? 0);
      } else {
        const res = await likeApi.createLike(boardId);

        setLiked((res.data.isLiked ?? 0) === 1);
        setLikes(res.data.likeCount ?? 0);
      }
    } catch (err) {
      console.error("좋아요 처리 실패", err);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div
          className={styles.avatarWrap}
          onClick={() => router.push(userId === MY_USER_ID ? "/profile" : `/users/${userId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push(userId === MY_USER_ID ? "/profile" : `/users/${userId}`)}
        >
          {profileImageUrl ? (
            <Image src={profileImageUrl} alt={username} width={40} height={40} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatar} style={{ background: color }}>
              {(username || "U")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div
          className={styles.meta}
          onClick={() => router.push(userId === MY_USER_ID ? "/profile" : `/users/${userId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push(userId === MY_USER_ID ? "/profile" : `/users/${userId}`)}
        >
          <span className={styles.username}>{username || "알 수 없음"}</span>
          <span className={styles.time}>{timeAgo(createdAt)}</span>
        </div>
        {!isOwnPost && following !== null && (
          <button className={`${styles.followBtn} ${following ? styles.following : ""}`} onClick={handleFollow}>
            {following ? "팔로잉" : "팔로우"}
          </button>
        )}
      </div>

      <div
        className={styles.cardLink}
        onClick={() => router.push(`/boards/${boardId}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && router.push(`/boards/${boardId}`)}
      >
        {images.length > 0 && (
          <div className={styles.mediaFrame}>
            <div className={styles.mediaList} ref={mediaListRef} onScroll={handleMediaScroll}>
              {images.map((url, index) => (
                <div className={styles.imageWrap} key={`${url}-${index}`}>
                  <Image
                    fill
                    unoptimized
                    src={mediaUrl(url)}
                    alt={`${username} 게시물 이미지 ${index + 1}`}
                    className={styles.image}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/no-image.svg";
                    }}
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
                  {"... "}
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
            <button className={styles.stat} onClick={handleLike}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >


              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>

            {likes.toLocaleString()}
          </button>
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
