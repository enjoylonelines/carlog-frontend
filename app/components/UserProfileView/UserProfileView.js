'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, checkFollow, followUser, unfollowUser } from '../../../api';
import { searchBoards } from '../../../api';
import styles from './UserProfileView.module.css';

const AVATAR_COLORS = ['#E03131', '#2F9E44', '#1971C2', '#F08C00', '#7048E8'];

function avatarColor(username) {
  if (!username) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < username.length; i++) sum += username.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const MY_USER_ID = 1;

export default function UserProfileView({ userId }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getUserProfile(userId).then((data) => {
      if (data) setProfile(data);
    });
    checkFollow({ userId: MY_USER_ID, targetId: userId }).then((data) => {
      if (data !== null) setFollowing(data);
    });
    searchBoards({ userId }).then((data) => {
      const boards = data?.boards;
      if (boards && Array.isArray(boards)) setPosts(boards);
    });
  }, [userId]);

  async function handleFollow() {
    setFollowLoading(true);
    if (following) {
      await unfollowUser({ userId: MY_USER_ID, targetId: userId });
      setFollowing(false);
      setProfile((prev) => prev ? { ...prev, followerCount: (prev.followerCount ?? 1) - 1 } : prev);
    } else {
      await followUser({ userId: MY_USER_ID, targetId: userId });
      setFollowing(true);
      setProfile((prev) => prev ? { ...prev, followerCount: (prev.followerCount ?? 0) + 1 } : prev);
    }
    setFollowLoading(false);
  }

  if (!profile) {
    return (
      <div className={styles.wrap}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className={styles.title}>프로필</span>
          <div className={styles.titleSpacer} />
        </div>
        <p className={styles.loading}>불러오는 중...</p>
      </div>
    );
  }

  const color = avatarColor(profile.username);
  const initial = profile.username ? profile.username[0].toUpperCase() : '?';

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.title}>{profile.username}</span>
        <div className={styles.titleSpacer} />
      </div>

      <div className={styles.header}>
        {profile.profileImageUrl ? (
          <img src={profile.profileImageUrl} alt="" className={styles.avatarLg} />
        ) : (
          <div className={styles.avatarLg} style={{ background: color }}>
            {initial}
          </div>
        )}
        <div className={styles.infoCol}>
          <div className={styles.username}>{profile.username}</div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{profile.boardCount ?? posts.length}</span>
              <span className={styles.statLabel}>게시물</span>
            </div>
            <button
              className={styles.stat}
              onClick={() => router.push(`/users/${userId}/follow?tab=followers`)}
            >
              <span className={styles.statNum}>{(profile.followerCount ?? 0).toLocaleString()}</span>
              <span className={styles.statLabel}>팔로워</span>
            </button>
            <button
              className={styles.stat}
              onClick={() => router.push(`/users/${userId}/follow?tab=followings`)}
            >
              <span className={styles.statNum}>{(profile.followingCount ?? 0).toLocaleString()}</span>
              <span className={styles.statLabel}>팔로잉</span>
            </button>
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className={styles.bio}>
          {profile.bio.split('\n').map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </p>
      )}

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${following ? styles.followingBtn : styles.followBtn}`}
          onClick={handleFollow}
          disabled={followLoading}
        >
          {following ? '팔로잉' : '팔로우'}
        </button>
      </div>

      <div className={styles.divider} />

      {posts.length === 0 ? (
        <p className={styles.empty}>게시물이 없습니다.</p>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <button
              key={post.boardId}
              className={styles.cell}
              onClick={() => router.push(`/boards/${post.boardId}`)}
            >
              {post.mediaUrls?.[0] ? (
                <img src={post.mediaUrls[0]} alt="" className={styles.img} loading="lazy" />
              ) : (
                <div className={styles.textCell}>
                  <p>{post.content}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
