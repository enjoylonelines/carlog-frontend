'use client';
import { useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar/Navbar';
import BottomNav from './components/BottomNav/BottomNav';
import CreatePost from './components/CreatePost/CreatePost';
import AuthContextProvider, { AuthContext } from '@/contexts/AuthContext';
import TokenExpirationWarning from "@/components/TokenExpirationWarning/TokenExpirationWarning";
import LoginModal from "@/components/LoginModal/LoginModal";
import { markFeedStale } from './utils/feedRefresh';
import NotificationContextProvider from '@/contexts/NotificationContext';
import styles from './ClientShell.module.css';

const PUBLIC_PATHS = ['/', '/explore'];

// 동적 라우트 체크 함수 (예: /users/123)
function isPublicPath(pathname) {
  // 고정 경로 체크
  if (PUBLIC_PATHS.includes(pathname)) return true;
  
  // 동적 라우트 체크
  if (pathname.startsWith('/users/')) return true;
  
  return false;
}

function RouteGuard({ children }) {
  const { user, showLoginModal, setShowLoginModal } = useContext(AuthContext);
  const pathname = usePathname();

  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (!user && !isPublic && !showLoginModal) {
      setShowLoginModal(true);
    }
  }, [user, isPublic, showLoginModal, setShowLoginModal]);

  return (
    <>
      <LoginModal showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal} />
      {(!user && !isPublic) ? (
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          {children}
        </div>
      ) : (
        children
      )}
    </>
  );
}

function Shell({ children }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard>
      <NotificationContextProvider>
        <Navbar />
        <main className={styles.main}>{children}</main>
        <BottomNav onCreateClick={() => setShowCreate(true)} />
      <TokenExpirationWarning />
        {showCreate && (
          <CreatePost
            onClose={() => setShowCreate(false)}
            onSaved={() => {
              markFeedStale();
              setShowCreate(false);
            }}
          />
        )}
      </NotificationContextProvider>
    </RouteGuard>
  );
}

export default function ClientShell({ children }) {
  return (
    <AuthContextProvider>
      <Shell>{children}</Shell>
    </AuthContextProvider>
  );
}
