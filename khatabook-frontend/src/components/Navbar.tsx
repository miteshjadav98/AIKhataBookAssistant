"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SupportTicketModal from "@/components/ai/SupportTicketModal";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const pathname = usePathname();

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      } else {
        setUser(null);
      }

      // Sync the theme state in real-time
      const currentTheme = localStorage.getItem("kb_theme") || "dark";
      setTheme(currentTheme);
    };

    handleStorageChange(); // Initial check
    
    // Poll for changes in case localStorage is modified in the same tab
    const interval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("kb_theme", next);
    if (next === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  };

  return (
    <header className="navbar glass-panel">
      <div className="nav-container">
        <Link href="/" className="logo">
          Khata<span className="text-gradient">Book</span>
        </Link>

        {/* Hamburger button – visible only on mobile */}
        <button
          className={`hamburger${menuOpen ? " hamburger--open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="hamburger__line" />
          <span className="hamburger__line" />
          <span className="hamburger__line" />
        </button>

        <nav className={`nav-links${menuOpen ? " nav-links--open" : ""}`}>
          {user?.role === "ADMIN" && (
            <>
              <Link href="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/customers" className="nav-link" onClick={() => setMenuOpen(false)}>Customers</Link>
              <Link href="/suppliers" className="nav-link" onClick={() => setMenuOpen(false)}>Suppliers</Link>
              <Link href="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Products</Link>
              <Link href="/sales" className="nav-link" onClick={() => setMenuOpen(false)}>Sales</Link>
              <Link href="/purchases" className="nav-link" onClick={() => setMenuOpen(false)}>Purchases</Link>
              <Link href="/reports" className="nav-link" onClick={() => setMenuOpen(false)}>Reports</Link>
              <Link href="/ai" className="nav-link" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>🤖 AI Copilot</Link>
              <button
                type="button"
                className="nav-link nav-link--button"
                onClick={() => { setSupportOpen(true); setMenuOpen(false); }}
              >
                <i className="fa-solid fa-life-ring" style={{ marginRight: "0.4rem" }}></i>Support
              </button>
            </>
          )}
          {user?.type === "CUSTOMER" && (
            <Link href="/my-khata" className="nav-link" onClick={() => setMenuOpen(false)}>My Khata</Link>
          )}
          
          {!user ? (
            <div className="nav-auth-buttons">
              <Link href="/auth/login" className="btn-primary login-btn" onClick={() => setMenuOpen(false)}>Shop Login</Link>
              <Link href="/auth/customer-login" className="btn-secondary login-btn" onClick={() => setMenuOpen(false)}>Customer Login</Link>
              
              {/* Theme Toggle - always visible & positioned after Customer Login */}
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
                <span className="theme-toggle-text">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Theme Toggle - positioned before Logout button */}
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
                <span className="theme-toggle-text">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="nav-user-section">
                <Link href="/settings" onClick={() => setMenuOpen(false)} title="Settings" style={{ display: 'flex' }}>
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name || "User"} 
                      className="nav-user-avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="nav-user-avatar nav-user-avatar--initials">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setUser(null);
                    setMenuOpen(false);
                    window.location.href = "/auth/login";
                  }}
                  className="btn-secondary login-btn"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div
          className="nav-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <SupportTicketModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </header>
  );
}
