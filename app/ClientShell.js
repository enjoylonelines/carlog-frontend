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

const PUBLIC_PATHS = ['/'];

function RouteGuard({ children }) {
  const { user, showLoginModal, setShowLoginModal } = useContext(AuthContext);
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!user && !isPublic) {
      setShowLoginModal(true);
    }
  }, [user, isPublic, setShowLoginModal]);

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
