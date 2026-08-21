/**
 * V7.0 — MarketingNav (v3.5 design system).
 *
 * Fixed, dark, translucent + backdrop blur.
 * Left: NEXUS. wordmark. Center: 6 nav links. Right: "Begin" → /auth.
 * Mobile: hamburger menu. Auth-aware for logged-in users.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { V3 } from '@/styles/v3-tokens';
import { Wordmark } from '@/components/marketing/v7-shell';
import { useAuthStore } from '@/stores/authStore';
import { getDefaultPortalRoute } from '@/services/portalClassification';
import { trackCTA, setTrackingUser } from '@/analytics/eventTracker';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/what', label: 'What it is' },
  { href: '/how', label: 'How it works' },
  { href: '/lenses', label: 'Lenses' },
  { href: '/membership', label: 'Membership' },
  { href: '/journal', label: 'Journal' },
];

export function MarketingNav(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setTrackingUser(null);
    await signOut();
    navigate('/', { replace: true });
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: V3.bodyFont,
    fontSize: '0.85rem',
    fontWeight: V3.fwMedium,
    color: active ? V3.cream : 'rgba(250,250,250,0.66)',
    textDecoration: 'none',
    transition: `color ${V3.durNormal}ms ${V3.ease}`,
  });

  return (
    <>
      <header
        className={scrolled ? 'v3-fixed-nav v3-nav-scrolled' : 'v3-fixed-nav'}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: V3.navHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(10, 10, 10, 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid transparent',
          transition: `border-color ${V3.durNormal}ms ${V3.ease}`,
        }}
      >
        {/* Wordmark */}
        <Link to="/" style={{ textDecoration: 'none' }} aria-label="NEXUS home">
          <Wordmark onDark />
        </Link>

        {/* Desktop nav — center */}
        <nav
          className="v3-nav-links"
          style={{ display: 'flex', alignItems: 'center', gap: 32 }}
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => trackCTA({ location: 'nav', label: item.label, destination: item.href })}
              style={navLinkStyle(isActive(item.href))}
              onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = V3.cream; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = isActive(item.href) ? V3.cream : 'rgba(250,250,250,0.66)'; }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <button
                onClick={() => navigate(getDefaultPortalRoute(profile?.role), { replace: true })}
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '0.85rem',
                  fontWeight: V3.fwMedium,
                  color: V3.cream,
                  background: 'transparent',
                  border: `1px solid ${V3.cream}`,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  transition: `background ${V3.durNormal}ms ${V3.ease}, color ${V3.durNormal}ms ${V3.ease}`,
                }}
                className="v3-nav-cta"
              >
                My Portal
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '0.8rem',
                  color: 'rgba(250,250,250,0.66)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => trackCTA({ location: 'nav', label: 'Begin', destination: '/auth' })}
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '0.8rem',
                color: V3.cream,
                textDecoration: 'none',
                padding: '10px 20px',
                border: `1px solid ${V3.cream}`,
                transition: `background ${V3.durNormal}ms ${V3.ease}, color ${V3.durNormal}ms ${V3.ease}`,
              }}
              className="v3-nav-cta"
            >
              Begin
            </Link>
          )}
        </div>
      </header>

      {/* Mobile hamburger toggle — visible on mobile only via CSS */}
      <button
        className="v3-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: V3.navHeight,
          width: V3.navHeight,
          zIndex: 101,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: V3.cream,
          fontSize: '1.4rem',
          lineHeight: 1,
        }}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="v3-mobile-menu"
          style={{
            position: 'fixed',
            top: V3.navHeight,
            left: 0,
            right: 0,
            zIndex: 99,
            background: V3.ink900,
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => {
                setMobileOpen(false);
                trackCTA({ location: 'nav', label: `${item.label} (mobile)`, destination: item.href });
              }}
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '1rem',
                color: isActive(item.href) ? V3.cream : 'rgba(250,250,250,0.66)',
                textDecoration: 'none',
                padding: '8px 0',
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: `1px solid rgba(250,250,250,0.1)`, marginTop: 8, paddingTop: 16 }}>
            {user ? (
              <>
                <Link
                  to={getDefaultPortalRoute(profile?.role)}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    background: V3.cream,
                    color: V3.ink900,
                    fontSize: '0.9rem',
                    fontWeight: V3.fwMedium,
                    textDecoration: 'none',
                    marginBottom: 8,
                  }}
                >
                  My Portal
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    border: `1px solid rgba(250,250,250,0.2)`,
                    color: V3.cream,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav', label: 'Begin (mobile)', destination: '/auth' }); }}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px',
                  background: V3.cream,
                  color: V3.ink900,
                  fontSize: '0.9rem',
                  fontWeight: V3.fwMedium,
                  textDecoration: 'none',
                }}
              >
                Begin
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default MarketingNav;
