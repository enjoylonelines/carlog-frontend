'use client';
import { useState, useRef } from 'react';
import { updateUserProfile, uploadProfileImage } from '../../../api';
import styles from './ProfileEditModal.module.css';

export default function ProfileEditModal({ profile, userId, onClose, onSaved }) {
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profile.profileImageUrl || null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!username.trim() || saving) return;
    setSaving(true);

    let profileImageUrl = profile.profileImageUrl ?? null;
    if (imageFile) {
      const uploaded = await uploadProfileImage(userId, imageFile);
      if (uploaded) profileImageUrl = uploaded;
    }

    const updated = await updateUserProfile(userId, {
      username: username.trim(),
      bio: bio.trim(),
      profileImageUrl,
    });
    setSaving(false);
    if (updated) {
      onSaved(updated);
      sessionStorage.setItem('feed_stale', '1');
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
          <span className={styles.title}>프로필 편집</span>
          <button
            className={`${styles.saveBtn} ${username.trim() ? styles.saveBtnActive : ''}`}
            onClick={handleSave}
            disabled={!username.trim() || saving}
          >
            {saving ? '저장 중' : '완료'}
          </button>
        </div>

        <div className={styles.avatarRow}>
          <button className={styles.avatarWrap} onClick={() => fileInputRef.current?.click()}>
            {previewUrl ? (
              <img src={previewUrl} alt="프로필" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar} style={{ background: profile.avatarColor }}>
                {(username || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className={styles.avatarOverlay}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <span className={styles.changePhotoText}>사진 변경</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleImageChange}
          />
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>이름</label>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="표시 이름"
              maxLength={30}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>소개</label>
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자신을 소개해보세요"
              maxLength={150}
              rows={4}
            />
            <span className={styles.charCount}>{bio.length}/150</span>
          </div>
        </div>
      </div>
    </div>
  );
}
