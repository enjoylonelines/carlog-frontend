'use client';
import styles from './HashtagBar.module.css';

const DEFAULT_TAGS = ['BMW', '현대', '기아', '벤츠', '포르쉐', '람보르기니', '튜닝', '드라이브', '전기차', '출고'];

export default function HashtagBar({ hashtags = [], selected, onSelect }) {
  const tags = hashtags.length > 0 ? hashtags.map((h) => h.tagName) : DEFAULT_TAGS;

  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        <button className={`${styles.chip} ${selected === null ? styles.active : ''}`} onClick={() => onSelect(null)}>
          전체
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            className={`${styles.chip} ${selected === tag ? styles.active : ''}`}
            onClick={() => onSelect(tag)}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
