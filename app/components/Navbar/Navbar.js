'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { searchUsers } from '../../../api';

const AVATAR_COLORS = ['#4ECDC4', '#45B7D1', '#96CEB4', '#6C5CE7', '#FD9644', '#DDA0DD'];

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) {
      const data = await searchUsers(val.trim());
      setResults(Array.isArray(data) ? data : []);
      setShowDrop(true);
    } else {
      setShowDrop(false);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoDot} />
          CARLOG
        </a>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="해시태그, 닉네임으로 검색"
            value={query}
            onChange={handleSearch}
            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
          />
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          {showDrop && results.length > 0 && (
            <div className={styles.dropdown}>
              {results.map((user, i) => (
                <button
                  key={user.userId || i}
                  className={styles.dropItem}
                  onClick={() => {
                    setShowDrop(false);
                    setQuery('');
                    router.push(`/?keyword=${encodeURIComponent(user.username)}`);
                  }}
                >
                  <div
                    className={styles.dropAvatar}
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className={styles.dropInfo}>
                    <span className={styles.dropName}>{user.username}</span>
                    {user.bio && <span className={styles.dropBio}>{user.bio}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link href="/notifications" className={styles.iconBtn} title="알림">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
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
