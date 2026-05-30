"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shopName, setShopName] = useState("");
  const [userName, setUserName] = useState("");
  const [theme, setTheme] = useState("dark");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedTheme = localStorage.getItem("kb_theme") || "dark";
    if (!storedUser) {
      router.push("/auth/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setShopName(parsed.shopName || "");
      setUserName(parsed.name || "");
      setTheme(storedTheme);
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveStatus("idle");
    setErrorMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userName,
          shopName: shopName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Update localStorage with fresh data from server
        const updatedUser = data.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setErrorMsg(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMsg(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("kb_theme", newTheme);
  };

  if (!user) return null;

  const tabs = [
    { key: "profile", label: "Profile", icon: "fa-user" },
    { key: "shop", label: "Shop", icon: "fa-store" },
    { key: "appearance", label: "Appearance", icon: "fa-palette" },
    { key: "about", label: "About", icon: "fa-info-circle" },
  ];

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '10px', 
            padding: '0.6rem 1rem', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            <i className="fa-solid fa-gear" style={{ marginRight: '0.5rem', color: 'var(--accent-primary)' }}></i> Settings
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your profile and preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Sidebar Tabs */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem', 
          minWidth: '180px'
        }}>
          {tabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.8rem 1.2rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--glass-bg)',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass-panel" style={{ flex: 1, padding: '2rem', minWidth: '300px' }}>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-user" style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}></i> Your Profile
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>View and update your personal information.</p>
              
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.4rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Full Name</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Email</label>
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontSize: '1rem',
                      opacity: 0.7
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email cannot be changed</span>
                </div>
              </div>
            </div>
          )}

          {/* Shop Tab */}
          {activeTab === "shop" && (
            <div>
              <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-store" style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}></i> Shop Settings
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Manage your shop details.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Shop Name</label>
                  <input 
                    type="text" 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Shop Code</label>
                  <div style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--accent-primary)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '2px'
                  }}>
                    {user.shopCode || "N/A"}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Share this code with your customers to connect</span>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Shop ID</label>
                  <div style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    opacity: 0.7
                  }}>
                    {user.shopId}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div>
              <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-palette" style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}></i> Appearance
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Customize how the app looks.</p>

              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: 500 }}>Theme</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { key: 'dark', label: 'Dark', icon: 'fa-moon', desc: 'Easy on the eyes' },
                  { key: 'light', label: 'Light', icon: 'fa-sun', desc: 'Clean and bright' },
                ].map(t => (
                  <button 
                    key={t.key}
                    onClick={() => handleThemeChange(t.key)}
                    style={{
                      flex: 1,
                      padding: '1.5rem 1rem',
                      borderRadius: '12px',
                      border: theme === t.key ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: theme === t.key ? 'rgba(139, 92, 246, 0.1)' : 'var(--glass-bg)',
                      color: theme === t.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <i className={`fa-solid ${t.icon}`} style={{ fontSize: '1.5rem' }}></i>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{t.label}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div>
              <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-info-circle" style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}></i> About
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Application information.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'App Name', value: 'AI KhataBook' },
                  { label: 'Version', value: 'v1.0.0' },
                  { label: 'AI Engine', value: 'LangGraph + Gemini 2.0 Flash' },
                  { label: 'Voice Engine', value: 'Sarvam AI (Bulbul v3)' },
                  { label: 'Backend', value: 'NestJS + Prisma + PostgreSQL' },
                  { label: 'Frontend', value: 'Next.js 14 + React' },
                ].map((item, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button - show on Profile & Shop tabs */}
          {(activeTab === "profile" || activeTab === "shop") && (
            <div>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{
                  marginTop: '2rem',
                  padding: '0.8rem 2rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: saveStatus === 'success' ? '#10b981' : saveStatus === 'error' ? '#ef4444' : 'var(--accent-primary)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
                ) : saveStatus === 'success' ? (
                  <><i className="fa-solid fa-check"></i> Saved to Database!</>
                ) : saveStatus === 'error' ? (
                  <><i className="fa-solid fa-xmark"></i> Failed</>
                ) : (
                  <><i className="fa-solid fa-save"></i> Save Changes</>
                )}
              </button>
              {saveStatus === 'error' && errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {errorMsg}
                </p>
              )}
              {saveStatus === 'success' && (
                <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <i className="fa-solid fa-circle-check"></i> Changes saved to the database and synced locally.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
