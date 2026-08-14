/**
 * Phase 16 — MarketingNav (public / marketing identity).
 *
 * No auth required. Brand: premium marketing nav.
 * Links: Home, Assessments, NEXUS, Pricing + Meet NEXUS CTA.
 * Visual: lots of whitespace, serif-heavy brand feel.
 * Zero radius, font trio, accent #C108AB.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getDefaultPortalRoute } from '@/services/portalClassification';
import { trackCTA, setTrackingUser } from '@/analytics/eventTracker';
import { DS } from '@/tokens';
import { Logo } from '@/components/ui/Logo';

export function MarketingNav(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handlePortalEntry = () => {
    if (user) {
      trackCTA({ location: 'nav_marketing', label: 'My Portal', destination: getDefaultPortalRoute(profile?.role) });
      navigate(getDefaultPortalRoute(profile?.role), { replace: true });
      return;
    }
    // W4-5: guest nav CTA → /nexus landing page (discovery), not direct chat.
    trackCTA({ location: 'nav_marketing', label: 'Meet NEXUS (guest portal)', destination: '/nexus' });
    navigate('/nexus');
  };

  const handleSignOut = async () => {
    setTrackingUser(null);
    await signOut();
    navigate('/', { replace: true });
  };

  const isHome = location.pathname === '/' && !location.hash;

  return (
    <header
      style={{
        background: scrolled ? 'rgba(255,255,255,0.98)' : DS.bg,
        borderBottom: scrolled ? `1px solid ${DS.border}` : '1px solid transparent',
        transition: 'border-color 0.2s, background 0.2s',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        fontFamily: DS.bodyFont,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        {/* Logo — shared component (#1356) */}
        <Logo size="md" variant="light" />

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          <Link to="/"
            onClick={() => trackCTA({ location: 'nav_marketing', label: 'Home', destination: '/' })}
            style={{
              fontSize: 14, fontWeight: 500,
              color: isHome ? DS.text : DS.textSecondary,
              textDecoration: 'none', fontFamily: DS.bodyFont,
            }}>
            Home
          </Link>

          <Link to="/assessments"
            onClick={() => trackCTA({ location: 'nav_marketing', label: 'Assessments', destination: '/assessments' })}
            style={{ fontSize: 14, fontWeight: 500, color: DS.textSecondary, textDecoration: 'none', fontFamily: DS.bodyFont }}>
            Assessments
          </Link>

          <Link to="/#nexus"
            onClick={() => trackCTA({ location: 'nav_marketing', label: 'NEXUS', destination: '/#nexus' })}
            style={{ fontSize: 14, fontWeight: 500, color: DS.textSecondary, textDecoration: 'none', fontFamily: DS.bodyFont }}>
            NEXUS
          </Link>

          <Link to="/pricing"
            onClick={() => trackCTA({ location: 'nav_marketing', label: 'Pricing', destination: '/pricing' })}
            style={{ fontSize: 14, fontWeight: 500, color: DS.textSecondary, textDecoration: 'none', fontFamily: DS.bodyFont }}>
            Pricing
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handlePortalEntry} style={{
                padding: '9px 18px', fontSize: 14, fontWeight: 600,
                background: 'transparent', color: DS.accent,
                border: `1px solid ${DS.accent}`, cursor: 'pointer',
                fontFamily: DS.bodyFont,
              }}>
                My Portal
              </button>
              <button onClick={handleSignOut} style={{
                background: 'none', border: 'none',
                fontSize: 14, color: DS.muted, cursor: 'pointer',
              }}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/login"
                onClick={() => trackCTA({ location: 'nav_marketing', label: 'Sign in', destination: '/login' })}
                style={{
                  fontSize: 14, fontWeight: 500, color: DS.textSecondary, textDecoration: 'none',
                }}>
                Sign in
              </Link>
              <button onClick={() => {
                // W4-5: nav CTA → /nexus landing page (discovery), not direct
                // chat. Primary entry is through assessment; nav is secondary.
                trackCTA({ location: 'nav_marketing', label: 'Meet NEXUS', destination: '/nexus' });
                navigate('/nexus');
              }} style={{
                padding: '9px 20px', fontSize: 14, fontWeight: 600,
                background: DS.accent, color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: DS.bodyFont,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <Sparkles size={15} />
                Meet NEXUS
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)}
          style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: DS.text }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden" style={{
          borderTop: `1px solid ${DS.border}`, padding: '16px 32px 24px',
          background: DS.bg, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <Link to="/" onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: 'Home (mobile)', destination: '/' }); }}
            style={{ padding: '10px 0', fontSize: 15, color: DS.text, textDecoration: 'none' }}>
            Home
          </Link>
          <Link to="/assessments" onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: 'Assessments (mobile)', destination: '/assessments' }); }}
            style={{ padding: '10px 0', fontSize: 15, color: DS.text, textDecoration: 'none' }}>
            Assessments
          </Link>
          <Link to="/#nexus" onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: 'NEXUS (mobile)', destination: '/#nexus' }); }}
            style={{ padding: '10px 0', fontSize: 15, color: DS.text, textDecoration: 'none' }}>
            NEXUS
          </Link>
          <Link to="/pricing" onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: 'Pricing (mobile)', destination: '/pricing' }); }}
            style={{ padding: '10px 0', fontSize: 15, color: DS.text, textDecoration: 'none' }}>
            Pricing
          </Link>
          <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: 4, paddingTop: 12 }} />
          {user ? (
            <>
              <button onClick={() => { setMobileOpen(false); handlePortalEntry(); }}
                style={{ marginTop: 8, padding: '12px', background: DS.accent, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                My Portal
              </button>
              <button onClick={() => { setMobileOpen(false); handleSignOut(); }}
                style={{ padding: '12px', background: 'transparent', border: `1px solid ${DS.border}`, color: DS.text, fontSize: 14, cursor: 'pointer' }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: 'Sign in (mobile)', destination: '/login' }); }}
                style={{ padding: '12px', textAlign: 'center', fontSize: 15, color: DS.text, textDecoration: 'none' }}>
                Sign in
              </Link>
              <Link to="/nexus" onClick={() => {
                setMobileOpen(false);
                // W4-5: mobile nav CTA → /nexus landing page (discovery).
                trackCTA({ location: 'nav_marketing', label: 'Meet NEXUS (mobile)', destination: '/nexus' });
              }}
                style={{ padding: '12px', textAlign: 'center', background: DS.accent, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                Meet NEXUS
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default MarketingNav;
