'use client';
import { useState, useEffect, useRef } from 'react';
import boardApi from '@/apis/boardApi';
import { getHashtags, updateBoard } from '../../lib/api';
import styles from './CreatePost.module.css';

const DEFAULT_TAGS = ['드라이브', '튜닝', '연비', '차박', '정비', 'BMW', '현대', '포르쉐'];

const CameraIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

export default function CreatePost({ onClose, initialPost, onSaved }) {
  const isEdit = !!initialPost;

  const [content, setContent] = useState(initialPost?.content ?? '');
  const [selectedTags, setSelectedTags] = useState(initialPost?.tags ?? []);
  const [hashtags, setHashtags] = useState([]);
  const [preview, setPreview] = useState(initialPost?.imageUrl ?? null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);

  const tagOptions = hashtags.length > 0 ? hashtags.map((h) => h.tagName) : DEFAULT_TAGS;

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMediaFiles(files);
    setPreview(URL.createObjectURL(files[0]));
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      if (isEdit) {
        await updateBoard({ boardId: initialPost.boardId, content, tags: selectedTags });
      } else {
        const formData = new FormData();
        formData.append('content', content);
        selectedTags.forEach((tag) => formData.append('hashtags', tag));
        mediaFiles.forEach((file) => formData.append('mediaFiles', file));

        await boardApi.boardWrite(formData);
      }

      onSaved?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const canPost = content.trim().length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <h2 className={styles.title}>{isEdit ? '게시물 수정' : '새 게시물'}</h2>
          <button
            className={`${styles.postBtn} ${canPost ? styles.postBtnActive : ''}`}
            onClick={handleSubmit}
            disabled={!canPost || submitting}
          >
            {submitting ? (isEdit ? '저장 중' : '게시 중') : (isEdit ? '저장' : '게시')}
          </button>
        </div>

        <div className={styles.body}>
          <button className={styles.imageArea} onClick={() => fileRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="미리보기" className={styles.preview} />
            ) : (
              <div className={styles.imagePlaceholder}>
                <CameraIcon />
                <span>사진 추가</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.fileInput}
              onChange={handleFile}
            />
          </button>

          <div className={styles.textArea}>
            <textarea
              className={styles.textarea}
              placeholder="차에 대한 이야기를 공유해보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              autoFocus
            />
            <div className={styles.charCount}>
              <span style={{ color: content.length > 450 ? '#E03131' : undefined }}>
                {content.length}
              </span>
              {' / 500'}
            </div>
          </div>

          <div className={styles.tagSection}>
            <span className={styles.tagLabel}>해시태그</span>
            <div className={styles.tagChips}>
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  className={`${styles.chip} ${selectedTags.includes(tag) ? styles.chipActive : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
