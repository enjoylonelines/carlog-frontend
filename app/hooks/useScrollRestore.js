import { useEffect, useRef, useCallback } from 'react';

if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
}

function scrollToBlocking(targetY) {
  const orig = window.scrollTo;
  let active = true;

  window.scrollTo = function (...args) {
    const top = typeof args[0] === 'object' ? (args[0]?.top ?? 0) : (args[1] ?? 0);
    if (active && top === 0) return;
    return orig.apply(window, args);
  };

  orig.call(window, { top: targetY, behavior: 'instant' });

  setTimeout(() => {
    active = false;
    window.scrollTo = orig;
  }, 600);
}

export function useScrollRestore(key) {
  const isRestoringRef = useRef(false);
  const pausedAfterClickRef = useRef(false);
  const pauseTimerRef = useRef(null);

  useEffect(() => {
    let rafId;

    // 클릭 순간의 scrollY가 가장 정확 — 즉시 저장 후 1s간 scroll 이벤트 저장 차단
    const saveOnClick = () => {
      if (isRestoringRef.current) return;
      sessionStorage.setItem(key, String(window.scrollY));
      pausedAfterClickRef.current = true;
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        pausedAfterClickRef.current = false;
      }, 1000);
    };

    const save = () => {
      if (isRestoringRef.current || pausedAfterClickRef.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(window.scrollY));
      });
    };

    document.addEventListener('click', saveOnClick, { capture: true });
    window.addEventListener('scroll', save, { passive: true });

    return () => {
      document.removeEventListener('click', saveOnClick, { capture: true });
      window.removeEventListener('scroll', save);
      cancelAnimationFrame(rafId);
      clearTimeout(pauseTimerRef.current);
    };
  }, [key]);

  const restoreScroll = useCallback(() => {
    const saved = sessionStorage.getItem(key);
    if (!saved || saved === '0') return;
    isRestoringRef.current = true;
    scrollToBlocking(parseInt(saved, 10));
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 700);
  }, [key]);

  return restoreScroll;
}
