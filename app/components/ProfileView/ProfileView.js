'use client';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../../lib/api';
import styles from './ProfileView.module.css';

const MOCK_PROFILE = {
  userId: 1,
  username: '카로그왕',
  bio: '차를 사랑하는 사람입니다. 주말마다 드라이브 🚗\n자동차 관련 정보 공유해요!',
  avatarColor: '#E03131',
  followerCount: 248,
  followingCount: 132,
  boardCount: 18,
};

const MOCK_POSTS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  imageUrl: `https://picsum.photos/seed/profile${i + 1}/400/400`,
}));

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function ProfileView() {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [tab, setTab] = useState('posts');

  useEffect(() => {
    getUserProfile(1).then((data) => {
      if (data && data.username) setProfile((prev) => ({ ...prev, ...data }));
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
              <span className={styles.statNum}>{profile.boardCount}</span>
              <span className={styles.statLabel}>게시물</span>
            </div>
            <button className={styles.stat}>
              <span className={styles.statNum}>{profile.followerCount.toLocaleString()}</span>
              <span className={styles.statLabel}>팔로워</span>
            </button>
            <button className={styles.stat}>
              <span className={styles.statNum}>{profile.followingCount.toLocaleString()}</span>
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
        <button
          className={`${styles.tabBtn} ${tab === 'posts' ? styles.tabActive : ''}`}
          onClick={() => setTab('posts')}
        >
          <GridIcon />
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'liked' ? styles.tabActive : ''}`}
          onClick={() => setTab('liked')}
        >
          <HeartIcon />
        </button>
      </div>

      <div className={styles.grid}>
        {(tab === 'posts' ? MOCK_POSTS : MOCK_POSTS.slice(0, 6)).map((post) => (
          <button key={post.id} className={styles.cell}>
            <img
              src={post.imageUrl}
              alt=""
              className={styles.img}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
