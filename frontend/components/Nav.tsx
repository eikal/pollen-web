import Link from 'next/link';
import { useEffect, useState } from 'react';
import StorageQuotaBar from './StorageQuotaBar';
import { Button } from './ui/Button';
import Card from './ui/Card';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function Nav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pollen_token') : null;
    setLoggedIn(!!token);

    if (token) {
      // Load user data from localStorage
      const userData = localStorage.getItem('pollen_user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          // ignore parse errors
        }
      }

      // Fetch org data
      fetchOrg(token);
    }
  }, []);

  const fetchOrg = async (token: string) => {
    try {
      const res = await fetch('http://localhost:4000/org', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrg(data.org);
      }
    } catch (err) {
      // Silently fail - user might not have an org yet
    }
  };

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pollen_token');
      localStorage.removeItem('pollen_user');
      setLoggedIn(false);
      setUser(null);
      setOrg(null);
      window.location.href = '/';
    }
  }

  return (
    <header style={{ 
      width: '100%', 
      borderBottom: '1px solid #e2e8f0', 
      background: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ 
            fontWeight: 700, 
            fontSize: '18px', 
            color: '#0f172a',
            textDecoration: 'none'
          }}>
            Pollen
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/" style={{ 
              fontSize: '12px', 
              fontWeight: 500,
              color: '#64748b',
              textDecoration: 'none'
            }}>
              Home
            </Link>
            <Link href="/uploads" style={{ 
              fontSize: '12px', 
              fontWeight: 500,
              color: '#64748b',
              textDecoration: 'none'
            }}>
              My Data
            </Link>
            <Link href="/upload" style={{ 
              fontSize: '12px', 
              fontWeight: 500,
              color: '#64748b',
              textDecoration: 'none'
            }}>
              Upload
            </Link>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {loggedIn && (user || org) && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: showDropdown ? '#f1f5f9' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#475569'
                }}
              >
                <span>{user?.email || 'Account'}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  style={{ color: '#94a3b8' }}
                >
                  <path d="M6 8l-4-4h8z" />
                </svg>
              </button>
              {showDropdown && (
                <>
                  <div 
                    style={{ 
                      position: 'fixed', 
                      inset: 0, 
                      zIndex: 10 
                    }} 
                    onClick={() => setShowDropdown(false)} 
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    zIndex: 20,
                    width: '224px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}>
                    {org && (
                      <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        background: '#f8fafc'
                      }}>
                        <div style={{
                          fontSize: '9px',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 500
                        }}>
                          Organization
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0f172a',
                          marginTop: '2px'
                        }}>
                          {org.name}
                        </div>
                      </div>
                    )}
                    <div style={{ padding: '4px 0' }}>
                      <Link
                        href="/uploads"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#475569',
                          textDecoration: 'none'
                        }}
                        onClick={() => setShowDropdown(false)}
                      >
                        📂 My Data
                      </Link>
                      <Link
                        href="/settings"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#475569',
                          textDecoration: 'none'
                        }}
                        onClick={() => setShowDropdown(false)}
                      >
                        ⚙️ Settings
                      </Link>
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#dc2626',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {!loggedIn && (
            <Link href="/auth/login">
              <Button variant="primary" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
