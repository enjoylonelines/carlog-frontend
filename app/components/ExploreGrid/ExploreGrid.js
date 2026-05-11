'use client';
import { useState, useEffect } from 'react';
import HashtagBar from '../HashtagBar/HashtagBar';
import { getHashtags } from '../../../api';
import styles from './ExploreGrid.module.css';

const TAGS = ['BMW', 'SUV', '포르쉐', '튜닝', '전기차', '람보르기니'];

const EXPLORE_ITEMS = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  imageUrl: `https://picsum.photos/seed/explore${i + 1}/400/400`,
  username: ['speedking', 'bmw_lover', 'porsche99', 'tuning_pro', 'ev_choi', 'lambo_kr'][i % 6],
  hitcount: [892, 1243, 567, 431, 2891, 334][i % 6],
  commentCount: [34, 78, 52, 29, 156, 21][i % 6],
  tag: TAGS[i % 6],
}));

export default function ExploreGrid() {
  const [hashtags, setHashtags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);

  const items = selectedTag
    ? EXPLORE_ITEMS.filter((item) => item.tag === selectedTag)
    : EXPLORE_ITEMS;

  return (
    <>
      <HashtagBar hashtags={hashtags} selected={selectedTag} onSelect={setSelectedTag} />
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {items.length > 0 ? (
            items.map((item) => (
              <button key={item.id} className={styles.cell}>
                <img
                  src={item.imageUrl}
                  alt={item.tag}
                  className={styles.img}
                  loading="lazy"
                />
                <div className={styles.overlay}>
                  <span className={styles.overlayTag}>#{item.tag}</span>
                  <div className={styles.overlayStats}>
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" fill="rgba(0,0,0,0.4)" />
                      </svg>
                      {item.hitcount.toLocaleString()}
                    </span>
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {item.commentCount}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className={styles.empty}>
              <span>🚗</span>
              <p>이 태그로 등록된 게시물이 없어요.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
