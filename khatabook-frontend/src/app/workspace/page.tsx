"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WorkspaceSelector() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    } catch (e) {
      router.push("/auth/login");
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="page-container animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="page-title">
          Welcome to <span className="text-gradient">AIKhataBook</span>
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.2rem' }}>
          Select your workspace mode for {user.shopName || "your shop"}
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem', 
        width: '100%', 
        maxWidth: '800px' 
      }}>
        
        {/* Classic CRM Mode */}
        <Link href="/dashboard" className="glass-panel" style={{ 
          padding: '3rem 2rem', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          textAlign: 'center',
          textDecoration: 'none',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
          }}>
            🏢
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Classic CRM
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Use the traditional dashboard, forms, and tables to manage your business manually.
          </p>
        </Link>

        {/* AI Workspace Mode */}
        <Link href="/ai" className="glass-panel" style={{ 
          padding: '3rem 2rem', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          textAlign: 'center',
          textDecoration: 'none',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
          }}>
            🤖
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            AI Assistant
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Voice-first business copilot. Manage your khata and get insights conversationally.
          </p>
        </Link>
      </div>
    </div>
  );
}
