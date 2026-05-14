'use client';
import { useState, useRef, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { searchUsers, getHashtags } from '../../../api';
import { avatarColor } from '../../utils/avatar';
import { NotificationContext } from '../../../contexts/NotificationContext';

export default function Navbar() {
  const router = useRouter();
  const { unreadCount } = useContext(NotificationContext);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 1) {
      debounceRef.current = setTimeout(async () => {
        const [usersData, tagsData] = await Promise.all([searchUsers(val.trim()), getHashtags(val.trim())]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setTags(Array.isArray(tagsData) ? tagsData.slice(0, 5) : []);
        setShowDrop(true);
      }, 300);
    } else {
      setShowDrop(false);
    }
  };

  const goSearch = () => {
    if (!query.trim()) return;
    setShowDrop(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') goSearch();
  };

  const hasResults = users.length > 0 || tags.length > 0;

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <a
          href="/"
          className={styles.logo}
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <span className={styles.logoDot} />
          CARLOG
        </a>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="사람, 태그, 게시물 검색 후 Enter"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
          />
          <button className={styles.searchIconBtn} onClick={goSearch} tabIndex={-1} aria-label="검색">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {showDrop && hasResults && (
            <div className={styles.dropdown}>
              {users.length > 0 && (
                <>
                  <div className={styles.dropSection}>사람</div>
                  {users.map((user, i) => (
                    <button
                      key={user.userId || i}
                      className={styles.dropItem}
                      onClick={() => {
                        setShowDrop(false);
                        setQuery('');
                        router.push(`/users/${user.userId}`);
                      }}
                    >
                      <div className={styles.dropAvatar} style={{ background: avatarColor(user.userId) }}>
                        {(user.username || 'U')[0].toUpperCase()}
                      </div>
                      <div className={styles.dropInfo}>
                        <span className={styles.dropName}>{user.username}</span>
                        {user.bio && <span className={styles.dropBio}>{user.bio}</span>}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {tags.length > 0 && (
                <>
                  <div className={styles.dropSection}>태그</div>
                  {tags.map((tag) => (
                    <button
                      key={tag.hashtagId ?? tag.tagName}
                      className={styles.dropItem}
                      onClick={() => {
                        setShowDrop(false);
                        setQuery('');
                        router.push(`/explore?tag=${encodeURIComponent(tag.tagName)}`);
                      }}
                    >
                      <div className={styles.dropTagIcon}>#</div>
                      <span className={styles.dropName}>#{tag.tagName}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link href="/notifications" className={styles.iconBtn} title="알림">
            <span className={styles.bellWrap}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="22"
                height="22"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </span>
          </Link>
          <Link href="/profile" className={styles.iconBtn} title="프로필">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
