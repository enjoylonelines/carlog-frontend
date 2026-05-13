'use client';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuthContext } from '../../../contexts/AuthContext';
import { getUserProfile, searchBoards } from '../../../api';
import ProfileEditModal from '../ProfileEditModal/ProfileEditModal';
import styles from './ProfileView.module.css';

const MOCK_PROFILE = {
  userId: null,
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
  const { userId: myUserId } = useContext(AuthContext);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [posts, setPosts] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState(false);

  const pageRef = useRef(1);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadPosts = useCallback(async (pageNo, append) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    const data = await searchBoards({ pageNo, userId: myUserId });
    isLoadingRef.current = false;

    const boards = data?.boards;
    if (boards?.length) {
      setPosts((prev) => (append ? [...prev, ...boards] : boards));
      setHasMore(pageNo < (data.pager?.totalPageNo ?? 1));
      if (data.pager?.totalRows != null) {
        setProfile((prev) => ({ ...prev, boardCount: data.pager.totalRows }));
      }
    } else {
      if (!append) setPosts([]);
      setHasMore(false);
    }
    pageRef.current = pageNo;
  }, []);

  useEffect(() => {
    if (!myUserId) return;
    getUserProfile(myUserId).then((data) => {
      if (data && data.username) setProfile((prev) => ({ ...prev, ...data }));
    });
    pageRef.current = 1;
    loadPosts(1, false);
  }, [myUserId, loadPosts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current && hasMore) {
          loadPosts(pageRef.current + 1, true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadPosts, posts.length]);

  return (
    <>
      {showEdit && (
        <ProfileEditModal
          profile={profile}
          userId={myUserId}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
        />
      )}
      <div className={styles.wrap}>
        <div className={styles.header}>
          {profile.profileImageUrl ? (
            <Image src={profile.profileImageUrl} alt="프로필" width={80} height={80} className={styles.avatarLg} />
          ) : (
            <div className={styles.avatarLg} style={{ background: profile.avatarColor }}>
              {profile.username[0].toUpperCase()}
            </div>
          )}
          <div className={styles.infoCol}>
            <div className={styles.username}>{profile.username}</div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNum}>{profile.boardCount ?? 0}</span>
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
          <button className={styles.actionBtn} onClick={() => setShowEdit(true)}>프로필 편집</button>
          <button className={styles.actionBtn} onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/users/${myUserId}`);
          setToast(true);
          setTimeout(() => setToast(false), 2000);
        }}>프로필 공유</button>
        {toast && <div className={styles.toast}>링크가 복사되었어요</div>}
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
                <img
                  src={post.mediaUrls?.[0] || '/no-image.svg'}
                  alt=""
                  className={styles.img}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = '/no-image.svg'; }}
                />
              </button>
            ))}
          </div>
        )}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </>
  );
}
