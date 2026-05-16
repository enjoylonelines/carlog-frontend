/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getHashtags, createBoard, updateBoard } from '../../../api';
import styles from './CreatePost.module.css';

const DEFAULT_TAGS = ['드라이브', '튜닝', '연비', '차박', '정비', 'BMW', '현대', '포르쉐'];

const CameraIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function CreatePost({ onClose, initialPost, onSaved }) {
  const router = useRouter();
  const isEdit = !!initialPost;

  const initialMediaUrls = initialPost?.mediaUrls?.length
    ? initialPost.mediaUrls
    : initialPost?.imageUrl
      ? [initialPost.imageUrl]
      : [];

  const [content, setContent] = useState(initialPost?.content ?? '');
  const [selectedTags, setSelectedTags] = useState(initialPost?.hashtags ?? initialPost?.tags ?? []);
  const [hashtags, setHashtags] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const selectedMediaRef = useRef([]);

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);

  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const tagOptions = hashtags.length > 0 ? hashtags.map((h) => h.tagName) : DEFAULT_TAGS;
  const displayMediaUrls = selectedMedia.length > 0 ? selectedMedia.map((item) => item.previewUrl) : initialMediaUrls;
  const isShowingSelectedMedia = selectedMedia.length > 0;

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedMedia((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    });
  };

  const removeSelectedMedia = (index) => {
    setSelectedMedia((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addCustomTag = () => {
    const tag = tagInput.trim().replace(/^#+/, '');
    if (!tag) return;

    setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    setTagInput('');
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      let savedBoard = null;
      const mediaFiles = selectedMedia.map((item) => item.file);

      if (isEdit) {
        savedBoard = await updateBoard({
          boardId: initialPost.boardId,
          content,
          hashtags: selectedTags,
          mediaFiles,
        });
      } else {
        savedBoard = await createBoard({
          content,
          hashtags: selectedTags,
          mediaFiles,
        });
      }

      onSaved?.(savedBoard);
      onClose();
      if (!isEdit && savedBoard?.boardId) {
        router.push(`/boards/${savedBoard.boardId}`);
      }
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
          <button className={styles.cancelBtn} onClick={onClose}>
            취소
          </button>
          <h2 className={styles.title}>{isEdit ? '게시물 수정' : '새 게시물'}</h2>
          <button
            className={`${styles.postBtn} ${canPost ? styles.postBtnActive : ''}`}
            onClick={handleSubmit}
            disabled={!canPost || submitting}
          >
            {submitting ? (isEdit ? '저장 중' : '게시 중') : isEdit ? '저장' : '게시'}
          </button>
        </div>

        <div className={styles.body}>
          <div
            className={styles.imageArea}
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
          >
            {displayMediaUrls.length > 0 ? (
              <div className={styles.previewList}>
                {displayMediaUrls.map((url, index) => (
                  <div className={styles.previewItem} key={`${url}-${index}`}>
                    <img src={url} alt={`미리보기 ${index + 1}`} className={styles.preview} />
                    {isShowingSelectedMedia && (
                      <span
                        className={styles.removeMediaBtn}
                        role="button"
                        tabIndex={0}
                        aria-label="이미지 선택 취소"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedMedia(index);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSelectedMedia(index);
                          }
                        }}
                      >
                        ×
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
          </div>

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
              <span style={{ color: content.length > 450 ? '#E03131' : undefined }}>{content.length}</span>
              {' / 500'}
            </div>
          </div>

          <div className={styles.tagSection}>
            <span className={styles.tagLabel}>해시태그</span>
            <div className={styles.tagInputRow}>
              <span className={styles.hashMark}>#</span>
              <input
                className={styles.tagInput}
                type="text"
                placeholder="직접 입력"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <button className={styles.tagAddBtn} onClick={addCustomTag} type="button">
                추가
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div className={styles.selectedTags}>
                {selectedTags.map((tag) => (
                  <button key={tag} className={styles.selectedTag} onClick={() => toggleTag(tag)} type="button">
                    #{tag}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
            <div className={styles.tagChips}>
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  className={`${styles.chip} ${selectedTags.includes(tag) ? styles.chipActive : ''}`}
                  onClick={() => toggleTag(tag)}
                  type="button"
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
