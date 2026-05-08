# Carlog Frontend

자동차 정보 공유/자랑 소셜 네트워크 서비스 (SNS)

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: JavaScript (JSX)
- **Styling**: CSS Modules
- **HTTP**: Native fetch (no axios)
- **Backend**: Spring Boot 3.5.3 + MyBatis + Oracle DB, port 80

## 서비스 개요

차량 사진/정보를 공유하고 자동차 애호가들끼리 소통하는 SNS.
인스타그램 스타일 피드 + 해시태그 기반 탐색.

## 디자인 시스템 (globals.css CSS 변수)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#E03131` | 레드 포인트 컬러 (sparse use) |
| `--color-primary-hover` | `#C92A2A` | hover 상태 |
| `--color-primary-subtle` | `#FFF5F5` | 연한 레드 배경 |
| `--color-bg` | `#FAFAFA` | 페이지 배경 |
| `--color-card` | `#FFFFFF` | 카드 배경 |
| `--color-text` | `#1A1A1A` | 기본 텍스트 |
| `--color-text-secondary` | `#737373` | 보조 텍스트 |
| `--color-border` | `#DBDBDB` | 구분선 |
| `--navbar-height` | `60px` | 네비바 높이 |
| `--content-max-width` | `600px` | 피드 최대 너비 |

## 컴포넌트 구조

```
app/
├── components/
│   ├── Navbar/          상단 고정 네비게이션 + 사용자 검색
│   ├── StoriesBar/      추천 사용자 가로 스크롤 (mock)
│   ├── HashtagBar/      해시태그 필터 칩 (실제 API)
│   └── PostCard/        게시물 카드
├── lib/
│   └── api.js           fetch 기반 API 클라이언트
└── page.js              메인 피드 페이지
```

## API 함수 (`app/lib/api.js`)

| 함수 | 엔드포인트 | 설명 |
|------|-----------|------|
| `getHashtags(name?)` | `GET /api/hashtags` | 해시태그 목록/검색 |
| `searchBoards({tag, keyword})` | `GET /api/boards/search` | 게시물 검색 |
| `searchUsers(keyword)` | `GET /api/users/search` | 사용자 검색 |

환경변수: `NEXT_PUBLIC_API_URL=http://localhost:80` (.env.local)

## 백엔드 API 전체 목록

```
GET    /api/hashtags                      해시태그 목록/검색 (?name=)
GET    /api/boards/search                 게시물 검색 (?tag= or ?keyword=)
GET    /api/boards/myBoardList            내 게시물 목록 (?pageNo=, 인증 필요)
GET    /api/users/{userId}                사용자 프로필 조회
GET    /api/users/search                  사용자 검색 (?keyword=)
POST   /api/follows                       팔로우 (body: {userId, targetId})
DELETE /api/follows                       언팔로우 (body: {userId, targetId})
GET    /api/follows/check                 팔로우 여부 (?userId=&targetId=)
GET    /api/follows/followers/{userId}    팔로워 목록
GET    /api/follows/followings/{userId}   팔로잉 목록
```

## 데이터 모델 요약

**Board**: boardId, userId, content, hitcount, createdAt, updatedAt, tags[]
**UserProfile**: userId, loginId, username, bio, profileImageUrl, followerCount, followingCount, boardCount
**Follow**: userId, targetId, followAt, username, profileImageUrl
**Hashtag**: hashtagId, tagName, createdAt

## DB 주요 테이블

CARLOG.USERS, CARLOG.USER_PROFILES, CARLOG.BOARDS, CARLOG.MEDIA,
CARLOG.COMMENTS, CARLOG.FOLLOWS, CARLOG.HASHTAGS, CARLOG.HASHTAG_MAP, CARLOG.BLOCKS

## React 코딩 규칙

### useEffect 내 setState 금지

`useEffect` 본문에서 `setState`를 **직접(동기)** 호출하지 않는다. ESLint 에러 발생 + 불필요한 cascading render 유발.

**금지 패턴:**
```js
useEffect(() => {
  setHidden(false); // ❌ effect 본문에서 직접 setState
}, [dependency]);
```

**대신: 이전 값을 state에 함께 저장해 render 중 비교 (React 공식 권장)**
```js
// ref.current를 render 중에 읽는 것도 금지 → state로 prevDep 관리
const [{ prevDep, value }, setState] = useState({ prevDep: dep, value: false });

if (dep !== prevDep) {
  setState({ prevDep: dep, value: false }); // ✅ render 중 호출, 무한루프 없음
}
```

- render 중 `ref.current` 읽기도 금지 (`Cannot access refs during render` 에러)
- `useEffect`에서 setState는 **반드시 이벤트 콜백(scroll, click 등) 안에서만** 호출한다.

---

## 구현 현황

- [x] 메인 피드 페이지 (mock + API 혼용)
- [x] 해시태그 필터 (실제 API 연동)
- [x] 사용자 검색 드롭다운 (실제 API 연동)
- [ ] 로그인/회원가입 (백엔드 미구현)
- [ ] 게시물 작성/수정/삭제
- [ ] 댓글 시스템
- [ ] 미디어 파일 업로드 (MEDIA 테이블 미구현)
- [ ] 팔로우 API 연동 (UI는 완성)
- [ ] 알림 시스템
