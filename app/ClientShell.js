'use client';
import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import BottomNav from './components/BottomNav/BottomNav';
import CreatePost from './components/CreatePost/CreatePost';
import styles from './ClientShell.module.css';

export default function ClientShell({ children }) {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <Navbar />
      <main className={styles.main}>{children}</main>
      <BottomNav onCreateClick={() => setShowCreate(true)} />
      {showCreate && <CreatePost onClose={() => setShowCreate(false)} />}
    </>
  );
}
