/**
 * Phase 16 — MarketingNav (public / marketing identity).
 *
 * No auth required. Brand: premium marketing nav.
 * Links: Products dropdown, Pricing, Meet NEXUS CTA.
 * Visual: lots of whitespace, serif-heavy brand feel.
 * Zero radius, font trio, accent #C108AB.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getDefaultPortalRoute } from '@/services/portalClassification';
import { trackCTA, trackNexusChatInitiation, setTrackingUser } from '@/analytics/eventTracker';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  border: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
};

export function MarketingNav(): React.ReactElement {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
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
    trackNexusChatInitiation('nav_cta');
    trackCTA({ location: 'nav_marketing', label: 'Try NEXUS (guest portal)', destination: '/nexus/chat' });
    navigate('/nexus/chat');
  };

  const handleSignOut = async () => {
    setTrackingUser(null);
    await signOut();
    navigate('/', { replace: true });
  };

  // Phase 9 Batch 6, ticket #1352 — only B2C products in marketing nav dropdown.
  // Match Analysis (B2B recruiters) + B2B Search Platform removed.
  const products = [
    { label: 'NEXUS AI', href: '/nexus/chat', desc: 'Your AI executive coach' },
    { label: 'Leadership Assessments', href: '/assessments', desc: '6 leadership assessments' },
  ];

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
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{
            width: 32, height: 32, background: DS.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: DS.headingFont, fontWeight: 700, fontSize: 15,
          }}>
            L
          </span>
          <span style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 700, color: DS.text }}>
            LYC Intelligence
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          {/* Products dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button style={{
              background: 'none', border: 'none', padding: '8px 2px',
              display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: DS.textSecondary,
              fontFamily: DS.bodyFont,
            }}>
              Products
              <ChevronDown size={14} style={{ transform: productsOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
            </button>
            {productsOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: -16, width: 320,
                background: DS.bg, border: `1px solid ${DS.border}`,
                padding: 8, marginTop: 4, zIndex: 60,
              }}>
                {products.map((p) => (
                  <Link key={p.label} to={p.href} onClick={() => setProductsOpen(false)}
                    style={{
                      display: 'block', padding: '12px 16px', textDecoration: 'none', color: DS.text,
                      border: 'none', background: 'transparent', cursor: 'pointer', width: '100%',
                      textAlign: 'left',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = `${DS.accent}0D`; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: DS.muted, marginTop: 2 }}>{p.desc}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/pricing"
            onClick={() => trackCTA({ location: 'nav_marketing', label: 'Pricing', destination: '/pricing' })}
            style={{ fontSize: 14, fontWeight: 500, color: DS.textSecondary, textDecoration: 'none' }}>
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
                trackNexusChatInitiation('nav_cta');
                trackCTA({ location: 'nav_marketing', label: 'Try NEXUS', destination: '/nexus/chat' });
                navigate('/nexus/chat');
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
          <Link to="/pricing" onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: 'Pricing (mobile)', destination: '/pricing' }); }}
            style={{ padding: '10px 0', fontSize: 15, color: DS.text, textDecoration: 'none' }}>
            Pricing
          </Link>
          <div style={{ borderTop: `1px solid ${DS.border}`, marginTop: 4, paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: DS.muted, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
              Products
            </div>
            {products.map((p) => (
              <Link key={p.label} to={p.href} onClick={() => { setMobileOpen(false); trackCTA({ location: 'nav_marketing', label: `Product: ${p.label} (mobile)`, destination: p.href }); }}
                style={{ display: 'block', padding: '10px 0', fontSize: 14, color: DS.text, textDecoration: 'none' }}>
                {p.label}
              </Link>
            ))}
          </div>
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
              <Link to="/nexus/chat" onClick={() => {
                setMobileOpen(false);
                trackNexusChatInitiation('nav_cta_mobile');
                trackCTA({ location: 'nav_marketing', label: 'Try NEXUS (mobile)', destination: '/nexus/chat' });
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
