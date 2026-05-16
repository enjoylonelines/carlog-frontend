'use client';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PostCard from '../components/PostCard/PostCard';
import { searchUsers, getHashtags, searchBoards } from '../../api';
import { useScrollRestore } from '../hooks/useScrollRestore';
import { avatarColor } from '../utils/avatar';
import styles from './page.module.css';

const TABS = [
  { key: 'users', label: '사람' },
  { key: 'tags', label: '태그' },
  { key: 'boards', label: '게시물' },
];

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
  mediaBackupUrls: board.mediaBackupUrls || [],
  imageUrl: board.mediaUrls?.[0] || '/no-image.svg',
  isLike: board.isLike,
  likeCount: board.likecount,
});

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';

  const restoreScroll = useScrollRestore('scroll_search');
  const lastRestoredQRef = useRef(null);

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);

  // q가 바뀌면 저장된 탭 복원 (같은 q로 돌아올 때), 새 검색어면 초기화
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem('search_tab');
    const savedQ = sessionStorage.getItem('search_tab_q');
    setActiveTab(savedQ === q && saved ? saved : 'users');
  }, [q]);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    Promise.all([searchUsers(q), getHashtags(q), searchBoards({ keyword: q })]).then(
      ([usersData, tagsData, boardsData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
        const raw = boardsData?.boards ?? [];
        setBoards(raw.map(mapBoard));
        setLoading(false);
      },
    );
  }, [q]);

  // 데이터 로드 완료 후 스크롤 복원 (q당 1회)
  useEffect(() => {
    if (!loading && lastRestoredQRef.current !== q) {
      lastRestoredQRef.current = q;
      restoreScroll();
    }
  }, [loading, q, restoreScroll]);

  const handleTabChange = (tab) => {
    sessionStorage.setItem('search_tab', tab);
    sessionStorage.setItem('search_tab_q', q);
    setActiveTab(tab);
  };

  const counts = { users: users.length, tags: tags.length, boards: boards.length };

  if (!q.trim()) {
    return (
      <div className={styles.empty}>
        <p>검색어를 입력해주세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.replace('/explore')}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className={styles.queryText}>
          <b>&ldquo;{q}&rdquo;</b> 검색 결과
        </span>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
            <span className={styles.tabCount}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div className={styles.results}>
          {activeTab === 'users' &&
            (users.length === 0 ? (
              <p className={styles.noResult}>일치하는 사람이 없어요.</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.userId}
                  className={styles.userRow}
                  onClick={() => router.push(`/users/${user.userId}`)}
                >
                  <div className={styles.userAvatar} style={{ background: avatarColor(user.userId) }}>
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.username}</span>
                    {user.bio && <span className={styles.userBio}>{user.bio}</span>}
                  </div>
                </button>
              ))
            ))}

          {activeTab === 'tags' &&
            (tags.length === 0 ? (
              <p className={styles.noResult}>일치하는 태그가 없어요.</p>
            ) : (
              <div className={styles.tagGrid}>
                {tags.map((tag) => (
                  <button
                    key={tag.hashtagId ?? tag.tagName}
                    className={styles.tagChip}
                    onClick={() => router.push(`/explore?tag=${encodeURIComponent(tag.tagName)}`)}
                  >
                    #{tag.tagName}
                  </button>
                ))}
              </div>
            ))}

          {activeTab === 'boards' &&
            (boards.length === 0 ? (
              <p className={styles.noResult}>일치하는 게시물이 없어요.</p>
            ) : (
              boards.map((post) => <PostCard key={post.boardId} post={post} />)
            ))}
        </div>
      )}
    </div>
  );
}
