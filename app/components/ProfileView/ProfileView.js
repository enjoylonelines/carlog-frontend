'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, searchBoards } from '../../../api';
import styles from './ProfileView.module.css';

const MY_USER_ID = 1;

const MOCK_PROFILE = {
  userId: MY_USER_ID,
  username: '카로그왕',
  bio: '차를 사랑하는 사람입니다. 주말마다 드라이브 🚗\n자동차 관련 정보 공유해요!',
  avatarColor: '#E03131',
  followerCount: 0,
  followingCount: 0,
  boardCount: 0,
};

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

export default function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getUserProfile(MY_USER_ID).then((data) => {
      if (data && data.username) setProfile((prev) => ({ ...prev, ...data }));
    });
    searchBoards({ userId: MY_USER_ID }).then((data) => {
      const boards = data?.boards;
      if (boards && Array.isArray(boards)) setPosts(boards);
    });
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.avatarLg} style={{ background: profile.avatarColor }}>
          {profile.username[0].toUpperCase()}
        </div>
        <div className={styles.infoCol}>
          <div className={styles.username}>{profile.username}</div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{profile.boardCount || posts.length}</span>
              <span className={styles.statLabel}>게시물</span>
            </div>
            <button className={styles.stat} onClick={() => router.push('/profile/follow?tab=followers')}>
              <span className={styles.statNum}>{(profile.followerCount ?? 0).toLocaleString()}</span>
              <span className={styles.statLabel}>팔로워</span>
            </button>
            <button className={styles.stat} onClick={() => router.push('/profile/follow?tab=followings')}>
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
        <button className={styles.actionBtn}>프로필 편집</button>
        <button className={styles.actionBtn}>프로필 공유</button>
      </div>

      <div className={styles.tabBar}>
        <button className={`${styles.tabBtn} ${styles.tabActive}`}>
          <GridIcon />
        </button>
      </div>

      {posts.length === 0 ? (
        <p className={styles.empty}>아직 게시물이 없어요.</p>
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
