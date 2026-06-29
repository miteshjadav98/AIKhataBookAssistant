"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SupportTicketModal from "@/components/ai/SupportTicketModal";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const pathname = usePathname();
  const moreRef = useRef<HTMLDivElement>(null);

  const closeMenus = () => {
    setMenuOpen(false);
    setMoreOpen(false);
  };

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

  // Close menus on route change
  useEffect(() => {
    const onNavigate = () => {
      setMenuOpen(false);
      setMoreOpen(false);
    };
    onNavigate();
  }, [pathname]);

  // Close the desktop "More" dropdown when clicking outside it
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
          Mitek<span className="text-gradient">One</span>
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
              <Link href="/dashboard" className="nav-link" onClick={closeMenus}>Dashboard</Link>
              <Link href="/customers" className="nav-link" onClick={closeMenus}>Customers</Link>
              <Link href="/sales" className="nav-link" onClick={closeMenus}>Sales</Link>
              <Link href="/products" className="nav-link" onClick={closeMenus}>Products</Link>

              {/* Secondary links grouped to keep the bar uncluttered (flat on mobile) */}
              <div className="nav-dropdown" ref={moreRef}>
                <button
                  type="button"
                  className="nav-link nav-link--button nav-dropdown-toggle"
                  onClick={() => setMoreOpen((o) => !o)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                >
                  More
                  <i className={`fa-solid fa-chevron-down nav-dropdown-caret${moreOpen ? " nav-dropdown-caret--open" : ""}`}></i>
                </button>
                <div className={`nav-dropdown-menu${moreOpen ? " nav-dropdown-menu--open" : ""}`}>
                  <Link href="/suppliers" className="nav-link" onClick={closeMenus}>Suppliers</Link>
                  <Link href="/purchases" className="nav-link" onClick={closeMenus}>Purchases</Link>
                  <Link href="/reports" className="nav-link" onClick={closeMenus}>Reports</Link>
                </div>
              </div>

              <button
                type="button"
                className="nav-link nav-link--button"
                onClick={() => { setSupportOpen(true); closeMenus(); }}
              >
                <i className="fa-solid fa-life-ring" style={{ marginRight: "0.4rem" }}></i>Support
              </button>
            </>
          )}
          {user?.type === "CUSTOMER" && (
            <Link href="/my-khata" className="nav-link" onClick={() => setMenuOpen(false)}>My Khata</Link>
          )}

          {/* Landing-page section links — only shown on the home page when not logged in */}
          {pathname === "/" && !user && (
            <>
              <a href="#about" className="nav-link" onClick={() => setMenuOpen(false)}>About</a>
              <a href="#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#ai-copilot" className="nav-link" onClick={() => setMenuOpen(false)}>AI Copilot</a>
              <a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</a>
            </>
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
