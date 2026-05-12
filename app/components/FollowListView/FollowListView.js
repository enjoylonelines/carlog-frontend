'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFollowers, getFollowings } from '../../../api';
import { avatarColor } from '../../utils/avatar';
import styles from './FollowListView.module.css';

export default function FollowListView({ initialTab = 'followers', userId }) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = tab === 'followers'
        ? await getFollowers(userId)
        : await getFollowings(userId);
      if (!cancelled) {
        setList(data || []);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tab, userId]);

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.title}>{tab === 'followers' ? '팔로워' : '팔로잉'}</span>
        <div className={styles.titleSpacer} />
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${tab === 'followers' ? styles.tabActive : ''}`}
          onClick={() => setTab('followers')}
        >
          팔로워
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'followings' ? styles.tabActive : ''}`}
          onClick={() => setTab('followings')}
        >
          팔로잉
        </button>
      </div>

      <div className={styles.list}>
        {loading && (
          <p className={styles.empty}>불러오는 중...</p>
        )}

        {!loading && list.length === 0 && (
          <p className={styles.empty}>
            {tab === 'followers' ? '아직 팔로워가 없습니다.' : '아직 팔로잉하는 사람이 없습니다.'}
          </p>
        )}

        {!loading && list.map((item) => {
          const displayUserId = tab === 'followers' ? item.userId : item.targetId;
          const color = avatarColor(displayUserId);
          const initial = item.username ? item.username[0].toUpperCase() : '?';
          return (
            <button
              key={`${item.userId}-${item.targetId}`}
              className={styles.item}
              onClick={() => router.push(`/users/${displayUserId}`)}
            >
              {item.profileImageUrl ? (
                <Image src={item.profileImageUrl} alt="" width={44} height={44} className={styles.avatar} />
              ) : (
                <div className={styles.avatar} style={{ background: color }}>
                  {initial}
                </div>
              )}
              <div className={styles.info}>
                <span className={styles.username}>{item.username}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
