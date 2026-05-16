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
