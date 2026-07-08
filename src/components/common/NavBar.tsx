import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, FileText, Settings, LogOut, ChevronDown, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

export function NavBar() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/assessment', label: 'Assessment' },
    { href: '/match', label: 'Match' },
    { href: '/nexus', label: 'Nexus AI' },
  ];

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 32px',
      background: DS.bg,
      borderBottom: `1px solid ${DS.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>
        LYC Intelligence
      </Link>

      {/* Desktop Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-nav">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            style={{ fontSize: '14px', color: DS.muted, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = DS.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = DS.muted)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* User Menu & Credits */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Credit Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: DS.card,
          border: `1px solid ${DS.cardBorder}`,
          borderRadius: '20px',
        }}>
          <CreditCard style={{ width: 14, height: 14, color: DS.accent }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: DS.text }}>—</span>
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: DS.card,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '0px',
              cursor: 'pointer',
              minHeight: '40px',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: DS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
            }}>
              {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '14px', color: DS.text }} className="user-name-desktop">
              {profile?.name || 'User'}
            </span>
            <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setUserMenuOpen(false)}
              />
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '220px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px',
                padding: '8px',
                zIndex: 100,
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              }}>
                <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${DS.border}`, marginBottom: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: DS.text, margin: '0 0 2px' }}>{profile?.name || 'User'}</p>
                  <p style={{ fontSize: '12px', color: DS.muted, margin: 0 }}>{user?.email}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    color: DS.textSecondary,
                    textDecoration: 'none',
                    borderRadius: '0px',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = DS.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <User style={{ width: 18, height: 18 }} />
                  Profile
                </Link>

                <Link
                  to="/documents"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    color: DS.textSecondary,
                    textDecoration: 'none',
                    borderRadius: '0px',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = DS.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileText style={{ width: 18, height: 18 }} />
                  Documents
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    color: DS.textSecondary,
                    textDecoration: 'none',
                    borderRadius: '0px',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = DS.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Settings style={{ width: 18, height: 18 }} />
                  Settings
                </Link>

                <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: '8px', paddingTop: '8px' }}>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: DS.error,
                      cursor: 'pointer',
                      borderRadius: '0px',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = DS.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut style={{ width: 18, height: 18 }} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: DS.text,
            cursor: 'pointer',
          }}
          className="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: DS.card,
          borderBottom: `1px solid ${DS.border}`,
          padding: '16px',
        }} className="mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: '14px 0',
                color: DS.text,
                textDecoration: 'none',
                fontSize: '15px',
                borderBottom: `1px solid ${DS.border}`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .user-name-desktop {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
