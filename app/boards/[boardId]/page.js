'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CreatePost from '../../components/CreatePost/CreatePost';
import boardApi from '@/apis/boardApi';
import { getComments, createComment, deleteComment, getReplies } from '../../lib/api';
import styles from './page.module.css';

const AVATAR_COLORS = ['#E03131', '#45B7D1', '#6C5CE7', '#96CEB4', '#FD9644', '#2196F3', '#FF9800'];
const avatarColor = (userId) => AVATAR_COLORS[(userId || 0) % AVATAR_COLORS.length];
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

const mediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

const MY_USER_ID = 1;

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const router = useRouter();

  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 대댓글 상태
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [repliesCache, setRepliesCache] = useState({});
  const [loadingReplies, setLoadingReplies] = useState(new Set());

  const commentInputRef = useRef(null);

  const mediaUrls = board?.mediaUrls || [];
  const firstImageUrl = mediaUrls.length > 0 ? mediaUrl(mediaUrls[0]) : null;
  const isOwner = board?.userId === MY_USER_ID;

  useEffect(() => {
    Promise.all([
      boardApi.boardRead(boardId).then((response) => response.data),
      getComments(boardId),
    ]).then(([boardData, commentData]) => {
      setBoard(boardData);
      setComments(Array.isArray(commentData) ? commentData : MOCK_COMMENTS);
      setLoading(false);
    });
  }, [boardId]);

  const handleDelete = async () => {
    await boardApi.boardDelete(boardId);
    router.back();
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);

    const currentReplyingTo = replyingTo; // 클로저 스냅샷
    const payload = {
      boardId: Number(boardId),
      userId: MY_USER_ID,
      content: commentText,
      parentCommentId: currentReplyingTo ? currentReplyingTo.commentId : null,
    };

    const result = await createComment(payload);
    if (!result) {
      setSubmitting(false);
      return;
    }

    const newEntry = {
      commentId: result.commentId,
      userId: MY_USER_ID,
      username: '카로그왕',
      content: commentText,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      parentCommentId: currentReplyingTo?.commentId ?? null,
    };

    if (currentReplyingTo) {
      const parentId = currentReplyingTo.commentId;
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
        )
      );
      setRepliesCache((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), newEntry],
      }));
      setExpandedReplies((prev) => new Set([...prev, parentId]));
      setReplyingTo(null);
    } else {
      setComments((prev) => [...prev, newEntry]);
    }

    setCommentText('');
    setSubmitting(false);
  };

  const handleCommentDelete = async (commentId) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    // 대댓글 캐시에서도 제거
    setRepliesCache((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  };

  const handleReplyDelete = async (replyId, parentId) => {
    await deleteComment(replyId);
    setRepliesCache((prev) => ({
      ...prev,
      [parentId]: (prev[parentId] || []).filter((r) => r.commentId !== replyId),
    }));
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === parentId ? { ...c, replyCount: Math.max(0, (c.replyCount || 1) - 1) } : c
      )
    );
  };

  const handleToggleReplies = async (commentId) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    // 아직 로드 안 된 경우 fetch
    if (!repliesCache[commentId]) {
      setLoadingReplies((prev) => new Set([...prev, commentId]));
      const data = await getReplies(commentId);
      setRepliesCache((prev) => ({
        ...prev,
        [commentId]: Array.isArray(data) ? data : MOCK_REPLIES,
      }));
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }

    setExpandedReplies((prev) => new Set([...prev, commentId]));
  };

  const startReply = (comment) => {
    setReplyingTo({ commentId: comment.commentId, username: comment.username || `user${comment.userId}` });
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!board) {
    return (
      <div className={styles.loadingWrap}>
        <p className={styles.errorText}>게시물을 찾을 수 없어요.</p>
        <button className={styles.backBtn} onClick={() => router.back()}>← 돌아가기</button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrap}>
        {/* 상단 헤더 */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <span className={styles.topTitle}>게시물</span>
          {isOwner && (
            <div className={styles.actions}>
              <button className={styles.actionBtn} onClick={() => setShowEdit(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setShowDeleteConfirm(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          )}
          {!isOwner && <div className={styles.actions} />}
        </div>

        <div className={styles.content}>
          {/* 작성자 정보 */}
          <div className={styles.authorRow}>
            <div className={styles.avatar} style={{ background: avatarColor(board.userId) }}>
              {(board.username || 'U')[0].toUpperCase()}
            </div>
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>{board.username || `user${board.userId}`}</span>
              <span className={styles.postTime}>{timeAgo(board.createdDate)}</span>
            </div>
            <button className={styles.followBtn}>팔로우</button>
          </div>

          {/* 이미지 */}
          {mediaUrls.length > 0 && (
            <div className={styles.mediaList}>
              {mediaUrls.map((url, index) => (
                <div className={styles.imageWrap} key={`${url}-${index}`}>
                  <img src={mediaUrl(url)} alt={`게시물 이미지 ${index + 1}`} className={styles.image} />
                </div>
              ))}
            </div>
          )}

          {/* 태그 */}
          {board.hashtags && board.hashtags.length > 0 && (
            <div className={styles.tags}>
              {board.hashtags.map((tag) => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {/* 본문 */}
          <p className={styles.bodyText}>{board.content}</p>

          {/* 통계 */}
          <div className={styles.stats}>
            <span className={styles.stat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {(board.hitcount || 0).toLocaleString()}
            </span>
            <span className={styles.stat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {comments.length}
            </span>
          </div>

          {/* 댓글 목록 */}
          <div className={styles.commentSection}>
            <div className={styles.commentHeader}>
              댓글 <span className={styles.commentCount}>{comments.length}</span>
            </div>

            {comments.length === 0 ? (
              <div className={styles.noComments}>첫 댓글을 남겨보세요 💬</div>
            ) : (
              comments.map((c) => (
                <div key={c.commentId}>
                  {/* 부모 댓글 */}
                  <div className={styles.commentItem}>
                    <div className={styles.commentAvatar} style={{ background: avatarColor(c.userId) }}>
                      {(c.username || 'U')[0].toUpperCase()}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentTop}>
                        <span className={styles.commentAuthor}>{c.username || `user${c.userId}`}</span>
                        <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className={styles.commentText}>{c.content}</p>
                      <div className={styles.commentActions}>
                        <button
                          className={styles.replyBtn}
                          onClick={() => startReply(c)}
                        >
                          답글 달기
                        </button>
                        {(c.replyCount > 0 || (repliesCache[c.commentId]?.length > 0)) && (
                          <button
                            className={styles.toggleRepliesBtn}
                            onClick={() => handleToggleReplies(c.commentId)}
                          >
                            {loadingReplies.has(c.commentId) ? (
                              '로딩 중...'
                            ) : expandedReplies.has(c.commentId) ? (
                              '답글 숨기기'
                            ) : (
                              `답글 보기(${c.replyCount || repliesCache[c.commentId]?.length || 0}개)`
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {c.userId === MY_USER_ID && (
                      <button
                        className={styles.commentDeleteBtn}
                        onClick={() => handleCommentDelete(c.commentId)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 대댓글 목록 */}
                  {expandedReplies.has(c.commentId) && (
                    <div className={styles.repliesList}>
                      {(repliesCache[c.commentId] || []).map((r) => (
                        <div key={r.commentId} className={`${styles.commentItem} ${styles.replyItem}`}>
                          <div className={styles.commentAvatar} style={{ background: avatarColor(r.userId) }}>
                            {(r.username || 'U')[0].toUpperCase()}
                          </div>
                          <div className={styles.commentBody}>
                            <div className={styles.commentTop}>
                              <span className={styles.commentAuthor}>{r.username || `user${r.userId}`}</span>
                              <span className={styles.commentTime}>{timeAgo(r.createdAt)}</span>
                            </div>
                            <p className={styles.commentText}>{r.content}</p>
                          </div>
                          {r.userId === MY_USER_ID && (
                            <button
                              className={styles.commentDeleteBtn}
                              onClick={() => handleReplyDelete(r.commentId, c.commentId)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className={styles.commentInputSpacer} />
        </div>
      </div>

      {/* 댓글/답글 입력 바 */}
      <div className={styles.commentBar}>
        {replyingTo && (
          <div className={styles.replyingToBar}>
            <span className={styles.replyingToText}>@{replyingTo.username}에게 답글 작성 중</span>
            <button className={styles.cancelReplyBtn} onClick={cancelReply}>✕</button>
          </div>
        )}
        <div className={styles.commentBarInner}>
          <div className={styles.commentBarAvatar} style={{ background: avatarColor(MY_USER_ID) }}>
            카
          </div>
          <input
            ref={commentInputRef}
            className={styles.commentInput}
            placeholder={replyingTo ? `@${replyingTo.username}에게 답글...` : '댓글 추가...'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
            maxLength={300}
          />
          <button
            className={`${styles.sendBtn} ${commentText.trim() ? styles.sendBtnActive : ''}`}
            onClick={handleCommentSubmit}
            disabled={!commentText.trim() || submitting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 수정 시트 */}
      {showEdit && (
        <CreatePost
          initialPost={{ ...board, tags: board.hashtags || [], imageUrl: firstImageUrl }}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            boardApi.boardRead(boardId).then((response) => {
              if (response.data) setBoard(response.data);
            });
          }}
        />
      )}

      {/* 삭제 확인 */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>게시물을 삭제할까요?</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDeleteConfirm(false)}>취소</button>
              <button className={styles.confirmDelete} onClick={handleDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const MOCK_COMMENTS = [
  { commentId: 1, userId: 2, username: '드라이브매니아', content: '정말 멋진 차네요! 저도 드라이브 가고 싶어지네요 😍', replyCount: 1, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { commentId: 2, userId: 3, username: '튜닝고수', content: '어디 코스로 다녀오셨나요? 저도 같은 차 타는데 공감 100%입니다 👍', replyCount: 0, createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
  { commentId: 3, userId: 4, username: '연비지존', content: '연비는 어떠세요? 고속주행 시 체감이 궁금합니다.', replyCount: 2, createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
];

const MOCK_REPLIES = [
  { commentId: 101, userId: 1, username: '카로그왕', content: '감사합니다! 저도 함께 드라이브해요 😄', replyCount: 0, createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
];
