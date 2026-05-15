'use client';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../contexts/AuthContext';
import { getUserProfile, searchBoards } from '../../../api';
import { getLikedBoards } from '../../../api/like';
import ProfileEditModal from '../ProfileEditModal/ProfileEditModal';
import styles from './ProfileView.module.css';

const isSrc = (url) => !!url && (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'));

let _savedTab = 'posts';

const MOCK_PROFILE = {
  userId: null,
  username: '카로그왕',
  bio: '차를 사랑하는 사람입니다. 주말마다 드라이브 🚗\n자동차 관련 정보 공유해요!',
  avatarColor: '#E03131',
  followerCount: 0,
  followingCount: 0,
  boardCount: 0,
};

function GridImage({ src, className }) {
  const [failed, setFailed] = useState(false);
  const imgSrc = !failed && isSrc(src) ? src : '/no-image.svg';
  return <img src={imgSrc} alt="" className={className} onError={() => setFailed(true)} />;
}

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function ProfileView() {
  const router = useRouter();
  const { userId: myUserId, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [profileImgErr, setProfileImgErr] = useState(false);
  const [posts, setPosts] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState(false);
  const [activeTab, setActiveTab] = useState(_savedTab);
  const [likedPosts, setLikedPosts] = useState([]);
  const settingsRef = useRef(null);

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
      if (data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
          username: data.username || prev.username,
        }));
        setProfileImgErr(false);
      }
    });
    pageRef.current = 1;
    loadPosts(1, false);
    getLikedBoards(myUserId).then((data) => {
      if (Array.isArray(data)) setLikedPosts(data);
    });
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
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadPosts, posts.length]);

  useEffect(() => {
    if (!showSettingsMenu) return;
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettingsMenu]);

  const handleLogout = () => {
    setShowSettingsMenu(false);
    logout();
    router.push('/');
  };

return (
    <>
      {showEdit && (
        <ProfileEditModal
          profile={profile}
          userId={myUserId}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setProfile((prev) => ({ ...prev, ...updated }));
            setProfileImgErr(false);
          }}
        />
      )}
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div ref={settingsRef} className={styles.settingsWrap}>
            <button className={styles.settingsBtn} onClick={() => setShowSettingsMenu((v) => !v)} aria-label="설정">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            {showSettingsMenu && (
              <div className={styles.settingsMenu}>
                <button className={styles.settingsItem} onClick={() => {
                  setShowSettingsMenu(false);
                  router.push('/account/edit');
                }}>
                  개인정보 수정
                </button>
                <div className={styles.settingsDivider} />
                <button className={`${styles.settingsItem} ${styles.settingsItemDanger}`} onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
          {isSrc(profile.profileImageUrl) && !profileImgErr ? (
            <img
              src={profile.profileImageUrl}
              alt="프로필"
              className={styles.avatarLg}
              onError={() => setProfileImgErr(true)}
            />
          ) : (
            <div className={styles.avatarLg} style={{ background: profile.avatarColor }}>
              {(profile.username || '?')[0].toUpperCase()}
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
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => setShowEdit(true)}>
            프로필 편집
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/users/${myUserId}`);
              setToast(true);
              setTimeout(() => setToast(false), 2000);
            }}
          >
            프로필 공유
          </button>
          {toast && <div className={styles.toast}>링크가 복사되었어요</div>}
        </div>

        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabActive : ''}`}
            onClick={() => { _savedTab = 'posts'; setActiveTab('posts'); }}
          >
            <GridIcon />
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'likes' ? styles.tabActive : ''}`}
            onClick={() => { _savedTab = 'likes'; setActiveTab('likes'); }}
          >
            <HeartIcon filled={activeTab === 'likes'} />
          </button>
        </div>

        {activeTab === 'posts' && (
          <>
            {posts.length === 0 ? (
              <p className={styles.empty}>아직 게시물이 없어요.</p>
            ) : (
              <div className={styles.grid}>
                {posts.map((post) => (
                  <button key={post.boardId} className={styles.cell} onClick={() => router.push(`/boards/${post.boardId}`)}>
                    <GridImage src={post.mediaUrls?.[0]} className={styles.img} />
                  </button>
                ))}
              </div>
            )}
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          </>
        )}

        {activeTab === 'likes' && (
          <>
            {likedPosts.length === 0 ? (
              <p className={styles.empty}>좋아요한 게시물이 없어요.</p>
            ) : (
              <div className={styles.grid}>
                {likedPosts.map((post) => (
                  <button key={post.boardId} className={styles.cell} onClick={() => router.push(`/boards/${post.boardId}`)}>
                    <GridImage src={post.mediaUrl} className={styles.img} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
