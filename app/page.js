"use client";
import { useState, useEffect, useReducer } from "react";
import StoriesBar from "./components/StoriesBar/StoriesBar";
import HashtagBar from "./components/HashtagBar/HashtagBar";
import PostCard from "./components/PostCard/PostCard";
import { getHashtags, searchBoards } from "./lib/api";
import styles from "./page.module.css";

const MOCK_POSTS = [
  {
    boardId: 1,
    username: "speedking_kim",
    avatarColor: "#E03131",
    content:
      "오늘 드라이브 다녀왔습니다 🏎️ 날씨가 너무 좋아서 한강변 코스로 달렸는데 정말 최고였어요. 차가 이렇게 잘 나갈 줄이야... M패키지 뽑기를 정말 잘한 것 같아요.",
    hitcount: 892,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tags: ["BMW", "M패키지", "드라이브"],
    imageUrl: "https://picsum.photos/seed/carlog1/600/450",
    commentCount: 34,
  },
  {
    boardId: 2,
    username: "porsche_diary",
    avatarColor: "#45B7D1",
    content:
      "포르쉐 911 첫 출고 후 6개월! 매일 타도 질리지 않는 차입니다. 요즘은 주말마다 자동차 모임 나가고 있어요. 같이 달릴 분들 댓글로 연락주세요!",
    hitcount: 1243,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    tags: ["포르쉐", "911", "자동차모임"],
    imageUrl: "https://picsum.photos/seed/carlog2/600/450",
    commentCount: 78,
  },
  {
    boardId: 3,
    username: "tuning_master",
    avatarColor: "#6C5CE7",
    content: "에어댐부터 배기까지 풀 튜닝 완료 💪 토크 체감이 진짜 장난 아님. 이번 주 트랙 데이 참가 예정이라 너무 기대됩니다!",
    hitcount: 567,
    createdAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    tags: ["튜닝", "트랙", "퍼포먼스"],
    imageUrl: "https://picsum.photos/seed/carlog3/600/450",
    commentCount: 52,
  },
  {
    boardId: 4,
    username: "ev_pioneer_choi",
    avatarColor: "#96CEB4",
    content:
      "전기차 전환 3개월 후기 ⚡ 충전 인프라가 생각보다 정말 괜찮네요. 고속도로 휴게소마다 충전 가능하고, 집 충전은 진짜 편해요. 유지비도 확실히 줄었습니다.",
    hitcount: 431,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    tags: ["전기차", "EV", "아이오닉6"],
    imageUrl: "https://picsum.photos/seed/carlog4/600/450",
    commentCount: 29,
  },
  {
    boardId: 5,
    username: "lambo_seoul",
    avatarColor: "#FD9644",
    content:
      "람보르기니 우루스 출고! 🟡 2년 기다린 보람이 있네요. 색상은 지알로 오리온으로 선택했는데 실물이 진짜... 출고 기념 드라이브 영상 곧 올릴게요.",
    hitcount: 2891,
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    tags: ["람보르기니", "우루스", "출고"],
    imageUrl: "https://picsum.photos/seed/carlog5/600/450",
    commentCount: 156,
  },
];

export default function FeedPage() {
  const [hashtags, setHashtags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [fetchState, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "loading": return { loading: true, apiPosts: state.apiPosts };
        case "success": return { loading: false, apiPosts: action.posts };
        case "error":   return { loading: false, apiPosts: [] };
        default:        return state;
      }
    },
    { loading: false, apiPosts: null }
  );

  const posts =
    selectedTag === null || fetchState.apiPosts === null
      ? MOCK_POSTS
      : fetchState.apiPosts;

  useEffect(() => {
    getHashtags().then((data) => {
      if (data && Array.isArray(data)) setHashtags(data);
    });
  }, []);

  useEffect(() => {
    if (selectedTag === null) return;

    let cancelled = false;
    dispatch({ type: "loading" });

    searchBoards({ tag: selectedTag }).then((data) => {
      if (cancelled) return;
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((board) => ({
          boardId: board.boardId,
          userId: board.userId,
          username: board.username,
          content: board.content,
          hitcount: board.hitcount,
          createdAt: board.createdAt,
          tags: board.tags?.length > 0 ? board.tags : [selectedTag],
          commentCount: board.commentCount ?? 0,
          imageUrl: `https://picsum.photos/seed/carlog${board.boardId}/600/450`,
        }));
        dispatch({ type: "success", posts: mapped });
      } else {
        dispatch({ type: "error" });
      }
    });

    return () => { cancelled = true; };
  }, [selectedTag]);

  return (
    <>
      <StoriesBar />
      <HashtagBar hashtags={hashtags} selected={selectedTag} onSelect={setSelectedTag} />
      <div className={styles.feed}>
        {fetchState.loading ? (
          <div className={styles.state}>
            <div className={styles.spinner} />
            <span>불러오는 중...</span>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.boardId} post={post} />)
        ) : (
          <div className={styles.state}>
            <span className={styles.emptyIcon}>🚗</span>
            <p>이 태그로 등록된 게시물이 없어요.</p>
          </div>
        )}
      </div>
    </>
  );
}
