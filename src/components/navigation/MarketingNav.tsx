/**
 * Phase 16 — MarketingNav (public / marketing identity).
 *
 * Batch 1.5 / Ticket 3: Simplified nav. Primary = NEXUS, Assessments, Pricing.
 * Logo click → Home (no separate Home link). Tier-aware: authenticated users
 * see "My Portal" + tier badge; guests see "Sign in" + "Meet NEXUS".
 * URL: /assessments/ (not /assessment/).
 *
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
import { useTier } from '@/components/tier/TierProvider';

export function MarketingNav(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuthStore();
  const { displayName: tierName, isEntryTier } = useTier();
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
    trackCTA({ location: 'nav_marketing', label: 'Meet NEXUS (guest portal)', destination: '/nexus' });
    navigate('/nexus');
  };

  const handleSignOut = async () => {
    setTrackingUser(null);
    await signOut();
    navigate('/', { replace: true });
  };

  // Primary nav items — NEXUS, Assessments, Pricing (per Batch 1.5 spec)
  const navItems = [
    { href: '/nexus/chat', label: 'Chat' },
    { href: '/assessments', label: 'Assessments' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

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
        {/* Logo — click → Home (replaces separate Home link) */}
        <Link to="/" onClick={() => trackCTA({ location: 'nav_marketing', label: 'Logo → Home', destination: '/' })}>
          <Logo size="md" variant="light" />
        </Link>

        {/* Desktop nav — 3 primary items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => trackCTA({ location: 'nav_marketing', label: item.label, destination: item.href })}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: isActive(item.href) ? DS.text : DS.textSecondary,
                textDecoration: 'none',
                fontFamily: DS.bodyFont,
              }}
            >
              {item.label}
            </Link>
          ))}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Tier badge — tier-aware nav */}
              {!isEntryTier && (
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: DS.accent,
                  padding: '4px 8px', border: `1px solid ${DS.accent}`,
                }}>
                  {tierName}
                </span>
              )}
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
                trackCTA({ location: 'nav_marketing', label: 'Try NEXUS', destination: '/nexus/chat' });
                navigate('/nexus/chat');
              }} style={{
                padding: '9px 20px', fontSize: 14, fontWeight: 600,
                background: DS.accent, color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: DS.bodyFont,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <Sparkles size={15} />
                Try NEXUS
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

      {/* Mobile panel — same 3 primary items */}
      {mobileOpen && (
        <div className="md:hidden" style={{
          borderTop: `1px solid ${DS.border}`, padding: '16px 32px 24px',
          background: DS.bg, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => {
                setMobileOpen(false);
                trackCTA({ location: 'nav_marketing', label: `${item.label} (mobile)`, destination: item.href });
              }}
              style={{
                padding: '10px 0', fontSize: 15,
                color: isActive(item.href) ? DS.accent : DS.text,
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: 4, paddingTop: 12 }} />
          {user ? (
            <>
              {!isEntryTier && (
                <span style={{ fontSize: 11, fontWeight: 600, color: DS.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {tierName} tier
                </span>
              )}
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
                trackCTA({ location: 'nav_marketing', label: 'Try NEXUS Chat (mobile)', destination: '/nexus/chat' });
              }}
                style={{ padding: '12px', textAlign: 'center', background: DS.accent, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                Try NEXUS
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default MarketingNav;
