'use client';
import { useFetchedImage } from '../../utils/mediaFallback';

/**
 * 프로필 이미지를 fetch+blob URL로 로드해 ngrok 차단을 우회하는 아바타 컴포넌트.
 * - src 없거나 로드 실패 시 이니셜 아바타(fallbackColor + fallbackChar)로 폴백
 * - 로딩 중엔 어두운 배경만 표시
 */
export default function FetchedAvatar({ src, fallbackChar, fallbackColor, className, style }) {
  const fetched = useFetchedImage(src || null);

  const centerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  if (!src || fetched === 'ERROR') {
    return (
      <div className={className} style={{ ...centerStyle, background: fallbackColor, ...style }}>
        {fallbackChar}
      </div>
    );
  }

  if (fetched === null) {
    return <div className={className} style={{ ...centerStyle, background: '#1a1a1a', ...style }} />;
  }

  return <img src={fetched} alt="" className={className} style={style} />;
}
