"use client";
import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import BottomNav from "./components/BottomNav/BottomNav";
import CreatePost from "./components/CreatePost/CreatePost";
import AuthContextProvider from "@/contexts/AuthContext";
import { markFeedStale } from "./utils/feedRefresh";
import styles from "./ClientShell.module.css";

export default function ClientShell({ children }) {
  const [showCreate, setShowCreate] = useState(false);

  const handleCreateSaved = () => {
    markFeedStale();
  };

  return (
    <AuthContextProvider>
      <Navbar />
      <main className={styles.main}>{children}</main>
      <BottomNav onCreateClick={() => setShowCreate(true)} />

        
      {showCreate && (
        <CreatePost
          onClose={() => setShowCreate(false)}
          onSaved={handleCreateSaved}
        />
      )}
    </AuthContextProvider>
  );
}
