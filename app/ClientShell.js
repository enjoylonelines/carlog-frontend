'use client';
import { useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './components/Navbar/Navbar';
import BottomNav from './components/BottomNav/BottomNav';
import CreatePost from './components/CreatePost/CreatePost';
import AuthContextProvider, { AuthContext } from '@/contexts/AuthContext';
import { markFeedStale } from './utils/feedRefresh';
import NotificationContextProvider from '@/contexts/NotificationContext';
import styles from './ClientShell.module.css';

const PUBLIC_PATHS = ['/', '/login'];

function RouteGuard({ children }) {
  const { user } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [user, isPublic, router]);

  if (!user && !isPublic) return null;

  return children;
}

function Shell({ children }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard>
      <NotificationContextProvider>
        <Navbar />
        <main className={styles.main}>{children}</main>
        <BottomNav onCreateClick={() => setShowCreate(true)} />
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
