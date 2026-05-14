import styles from './StoriesBar.module.css';

const MOCK_USERS = [
  { id: 1, username: 'speedking', initial: 'S', color: '#E03131', ring: true },
  { id: 2, username: 'bmw_lover', initial: 'B', color: '#4ECDC4', ring: true },
  { id: 3, username: 'porsche99', initial: 'P', color: '#45B7D1', ring: true },
  { id: 4, username: 'tuning_pro', initial: 'T', color: '#6C5CE7', ring: true },
  { id: 5, username: 'car_diary', initial: 'C', color: '#FECA57', ring: true },
  { id: 6, username: 'ev_choi', initial: 'E', color: '#96CEB4', ring: false },
  { id: 7, username: 'drive_kr', initial: 'D', color: '#FD9644', ring: false },
  { id: 8, username: 'lambo_kr', initial: 'L', color: '#DDA0DD', ring: false },
  { id: 9, username: 'moto_park', initial: 'M', color: '#74B9FF', ring: false },
];

export default function StoriesBar() {
  return (
    <section className={styles.section}>
      <div className={styles.track}>
        {MOCK_USERS.map((user) => (
          <button key={user.id} className={styles.story}>
            <div className={`${styles.ring} ${user.ring ? styles.ringActive : ''}`}>
              <div className={styles.avatar} style={{ background: user.color }}>
                {user.initial}
              </div>
            </div>
            <span className={styles.name}>{user.username}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
