'use client';
import { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationContext } from '../../../contexts/NotificationContext';
import styles from './BottomNav.module.css';

const HomeIcon = () => (
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
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ExploreIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    width="22"
    height="22"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const BellIcon = () => (
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
);

const ProfileIcon = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'feed', path: '/', label: '홈', Icon: HomeIcon },
  { id: 'explore', path: '/explore', label: '탐색', Icon: ExploreIcon },
  { id: 'create', path: null, label: null, Icon: null },
  { id: 'notifications', path: '/notifications', label: '알림', Icon: BellIcon },
  { id: 'profile', path: '/profile', label: '프로필', Icon: ProfileIcon },
];

const SCROLL_PATHS = new Set(['/', '/explore']);
const HIDE_THRESHOLD = 8;

export default function BottomNav({ onCreateClick }) {
  const pathname = usePathname();
  const { unreadCount } = useContext(NotificationContext);
  const lastScrollY = useRef(0);
  // prevPath를 state에 함께 저장해 render 중 비교 (ref.current 읽기 금지 대응)
  const [{ prevPath, scrollHidden }, setNavState] = useState({
    prevPath: pathname,
    scrollHidden: false,
  });

  if (pathname !== prevPath) {
    setNavState({ prevPath: pathname, scrollHidden: false });
  }

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    if (!SCROLL_PATHS.has(pathname)) return;

    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      if (delta > HIDE_THRESHOLD) setNavState((s) => ({ ...s, scrollHidden: true }));
      else if (delta < -HIDE_THRESHOLD) setNavState((s) => ({ ...s, scrollHidden: false }));
      lastScrollY.current = current;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  const isDetailPage = pathname.startsWith('/boards/');

  return (
    <nav className={`${styles.nav} ${scrollHidden || isDetailPage ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        {NAV_ITEMS.map((item) => {
          if (item.id === 'create') {
            return (
              <button key="create" className={styles.fab} aria-label="게시물 작성" onClick={onCreateClick}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  width="22"
                  height="22"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            );
          }
          const active = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`${styles.item} ${active ? styles.active : ''}`}
              aria-label={item.label}
            >
              <span className={styles.icon}>
                <item.Icon />
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
