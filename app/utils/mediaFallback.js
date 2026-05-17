import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export const toMediaSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
};

export const isMediaSrc = (url) => (
  !!url && (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'))
);

export const useBackupImageOnError = (event, backupUrl) => {
  const img = event.currentTarget;
  const fallbackSrc = backupUrl && isMediaSrc(backupUrl) ? toMediaSrc(backupUrl) : null;
  const normalizedFallbackSrc = fallbackSrc ? new URL(fallbackSrc, window.location.origin).href : null;

  if (fallbackSrc && img.src !== normalizedFallbackSrc) {
    img.src = fallbackSrc;
    return;
  }

  if (!img.src.endsWith('/no-image.svg')) {
    img.src = '/no-image.svg';
  }
};

// fetch로 이미지를 가져와 blob URL로 변환 (ngrok 헤더 우회)
// null = 로딩 중 (배경만 표시), 'ERROR' = 실패, blob: = 성공
export const useFetchedImage = (url) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!url) {
      setState('ERROR');
      return;
    }
    setState(null);
    const absUrl = toMediaSrc(url);
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    let objectUrl = null;
    let cancelled = false;

    fetch(absUrl, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setState('ERROR');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state;
};
