/**
 * V-App 3/7 — Lenses Library (v3.5).
 *
 * Spec § 4:
 *   960px max, 48px below topbar.
 *   PageHeader: kicker "LENSES LIBRARY" teal-600 / title: Eleven lenses. / desc
 *   Right: tier badge · miles balance pill · Upgrade (→ /membership)
 *   Summary row (56px height, 1px ink-200 top/bottom):
 *       Completed 03 · Average 62 · Locked 04 · Miles 50
 *       MonoLabel keys, Crimson Pro 20px 600 values
 *   Sections SHIFT then Advisory:
 *     Row MonoLabel eyebrow (GROUP 01 · SHIFT / GROUP 02 · ADVISORY)
 *     Title "SHIFT — the five operating lenses." Crimson Pro 20px 400
 *     Description line ink-500 14px mt 8 max 520
 *     3-col grid gap 24 / mb 48, 20px padding, 1px ink-100
 *
 *   LENS CARD (§ 3.2):
 *     16px icon (teal-500 line) · Lens name (16px 600) · Meta row (IBM Plex Mono 10.5px 12% LS: Practice · 15 min · 2 miles)
 *     Status badge (right): Completed → teal-50 bg/teal-700 text; Available → ink-100/ink-500; Locked → ink-50 bg/ink-400 text + lock icon
 *     Description: score insight (60 chars max; lowest scoring dim) OR tagline if not completed
 *     Score bar 2px: score color banding OR ink-100 if not taken OR ink-50 bg if locked
 *
 * Tier gating & score fetching:
 *   - Subscription tier via useAuthStore profile.tier
 *   - Completed scores via fetchUserLensResults (Supabase)
 *   - Access via canAccessLens rule (Explorer → PRISM+SPARK, Starter → +LEAP+IMPACT,
 *     Pro → +QUEST+BRIDGE+MOSAIC, Executive+ → all 11)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { normalizeTier, tierDisplayName } from '@/config/tierConfig';
import { V3 } from '@/styles/v3-tokens';
import {
  Badge,
  Button,
  MonoLabel,
  PageHeader,
  ScoreBar,
  Skeleton,
  scoreColor,
} from '@/components/app-v3/ui';
import {
  fetchUserLensResults,
  canAccessLens,
  unlockTierFor,
  SHIFT5_KEYS,
  ADVISORY6_KEYS,
  ORDERED_LENS_CODES,
  PILLAR_GROUP_META,
  lensDisplayName,
  lensTagline,
  lensPriceMiles,
  lensDuration,
  lensPillarGroup,
  type PillarGroup,
  type UserLensResultMap,
} from '@/services/lensLibraryService';

/* ── SVG icons (line-art, stroke currentColor, no fills) ──────────── */

function lockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5" width="7" height="5.5"/>
      <path d="M4.5 5V3.5a1.5 1.5 0 1 1 3 0V5"/>
    </svg>
  );
}

function lensPillarIcon(group: PillarGroup) {
  const shared = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: '1.2', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (group === 'SHIFT') {
    return (
      <svg {...shared} aria-hidden>
        <path d="M2 10l4-3 3 2 5-5"/>
        <circle cx="2" cy="10" r="1"/>
        <circle cx="6" cy="7" r="1"/>
        <circle cx="9" cy="9" r="1"/>
        <circle cx="14" cy="4" r="1"/>
      </svg>
    );
  }
  return (
    <svg {...shared} aria-hidden>
      <circle cx="5.5" cy="8" r="3"/>
      <circle cx="10.5" cy="8" r="3"/>
      <path d="M8.25 6h-.01"/>
    </svg>
  );
}

function lensIcon(code: string, color: string) {
  // Common 16px shape: simple geometric, no fills, 1.2 stroke, color=color
  const shapes: Record<string, React.ReactNode> = {
    CPI: <>
      <path d="M3 3.5h10M3 8h10M3 12.5h10"/>
      <circle cx="5" cy="3.5" r="0.8" fill={color}/>
      <circle cx="10" cy="8" r="0.8" fill={color}/>
      <circle cx="7" cy="12.5" r="0.8" fill={color}/>
    </>,
    LEAP: <>
      <path d="M2.5 13.5l5-10 2 6 4-3"/>
    </>,
    QUEST: <>
      <circle cx="8" cy="7.5" r="4"/>
      <path d="M6.5 6.5c0-1 .5-2 1.5-2S9.5 5.5 9.5 6.5c0 1-1 1-1 2"/>
      <path d="M8 12v.01"/>
    </>,
    IMPACT: <>
      <circle cx="8" cy="8" r="5"/>
      <path d="M8 3v10M3 8h10"/>
    </>,
    DRIVE: <>
      <circle cx="8" cy="8" r="5"/>
      <path d="M8 4.5v3.5l2.5 1.5"/>
    </>,
    COACH: <>
      <circle cx="5.5" cy="6.5" r="1.8"/>
      <circle cx="10.5" cy="6.5" r="1.8"/>
      <path d="M3 12.5c.5-1 1.8-2 2.5-2s2 1 2.5 2"/>
      <path d="M9 10.5c.5-.7 1-1.3 1.5-1.3s1 .6 1.5 1.3"/>
    </>,
    PRISM: <>
      <path d="M8 2l5.5 11h-11z"/>
      <path d="M8 2l-2.5 11M8 2l5.5 11"/>
    </>,
    SPARK: <>
      <path d="M8 2.5l1.8 4 4.2.5-3.2 2.7 1 4.3L8 11.5 4.2 14l1-4.3L2 7l4.2-.5z"/>
    </>,
    FORGE: <>
      <path d="M2.5 12.5V9h3l2-3 2 0 1 3h3v3.5"/>
      <path d="M5.5 6V4h5v2"/>
    </>,
    BRIDGE: <>
      <path d="M2.5 12.5V9.5M13.5 12.5V9.5"/>
      <path d="M4 9.5h8"/>
      <path d="M5.5 6.5v3M8 5.5v4M10.5 6.5v3"/>
    </>,
    MOSAIC: <>
      <rect x="2.5" y="2.5" width="4.5" height="4.5"/>
      <rect x="9" y="2.5" width="4.5" height="4.5"/>
      <rect x="2.5" y="9" width="4.5" height="4.5"/>
      <rect x="9" y="9" width="4.5" height="4.5"/>
    </>,
  };
  const node = shapes[code] ?? <>
    <circle cx="8" cy="8" r="5"/>
    <circle cx="8" cy="8" r="1.5"/>
  </>;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {node}
    </svg>
  );
}

/* ── Lens card ─────────────────────────────────────────────────────── */

function LensCard({
  code,
  result,
  canAccess,
  userTier,
}: {
  code: string;
  result: UserLensResultMap[string] | undefined;
  canAccess: boolean;
  userTier: string | null | undefined;
}): React.ReactElement {
  const name = lensDisplayName(code);
  const tagline = lensTagline(code);
  const miles = lensPriceMiles(code);
  const duration = lensDuration(code);
  const group = lensPillarGroup(code);
  const score = result?.score;
  const level = result?.level;
  const iconColor = canAccess ? V3.teal500 : V3.ink200;

  // Status badge
  let badge: React.ReactNode;
  let desc: React.ReactNode;
  if (!canAccess) {
    const unlock = unlockTierFor(code);
    badge = (
      <Badge variant="status-draft" size="small" style={{ gap: 4, display: 'inline-flex' }}>
        {lockIcon()}
        {`${unlock ?? 'Locked'}`}
      </Badge>
    );
    desc = (
      <span style={{ color: V3.ink400, fontSize: '13px', fontFamily: V3.bodyFont, lineHeight: 1.5 }}>
        Available with {unlock} tier.
      </span>
    );
  } else if (result) {
    badge = <Badge variant="status-ready" size="small">Completed</Badge>;
    desc = (
      <span style={{ color: V3.ink500, fontSize: '13px', fontFamily: V3.bodyFont, lineHeight: 1.5 }}>
        {level ? `${level} — ` : ''}
        {tagline}
      </span>
    );
  } else {
    badge = <Badge variant="count" size="small">Available</Badge>;
    desc = (
      <span style={{ color: V3.ink500, fontSize: '13px', fontFamily: V3.bodyFont, lineHeight: 1.5 }}>
        {tagline || 'Comprehensive readout + NEXUS coaching integration.'}
      </span>
    );
  }

  const destination = canAccess
    ? (result ? `/app/v3/lenses/${code.toLowerCase()}/readout/${result.resultId}` : `/app/v3/lenses/${code.toLowerCase()}`)
    : '/membership';

  return (
    <Link
      to={destination}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        padding: 20,
        border: `1px solid ${V3.ink100}`,
        background: V3.white,
        transition: `border-color ${V3.durFast}ms ${V3.ease}, transform ${V3.durNormal}ms ${V3.ease}`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = V3.ink200;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '';
        el.style.transform = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
          <div style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: canAccess ? V3.teal500 : V3.ink200 }}>
            {lensIcon(code, iconColor)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '16px',
                fontWeight: V3.fwSemibold,
                color: V3.ink900,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              {name}
            </div>
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                fontFamily: V3.monoFont,
                fontSize: V3.textAppMono,
                fontWeight: V3.fwMedium,
                letterSpacing: V3.trackingMono,
                textTransform: 'uppercase',
                color: V3.ink400,
                lineHeight: 1,
              }}
            >
              <span>{group}</span>
              <span style={{ color: V3.ink200 }}>·</span>
              <span>{duration} min</span>
              <span style={{ color: V3.ink200 }}>·</span>
              <span>{miles} miles</span>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>{badge}</div>
      </div>

      <div style={{ marginTop: 16, minHeight: 40 }}>
        {desc}
      </div>

      <div style={{ marginTop: 12 }}>
        {canAccess && result ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <MonoLabel size="sm" color={V3.ink400}>SCORE</MonoLabel>
              <span
                style={{
                  fontFamily: V3.displayFont,
                  fontSize: '14px',
                  fontWeight: V3.fwSemibold,
                  color: scoreColor(score),
                  lineHeight: 1,
                }}
              >
                {score}
                <span style={{ fontSize: '11px', color: V3.ink400, marginLeft: 2 }}>/ 100</span>
              </span>
            </div>
            <ScoreBar score={score} />
          </>
        ) : canAccess ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <MonoLabel size="sm" color={V3.ink400}>NOT TAKEN</MonoLabel>
              <span style={{ color: V3.ocean600, fontFamily: V3.bodyFont, fontSize: '12px', fontWeight: V3.fwMedium, lineHeight: 1 }}>
                Take lens →
              </span>
            </div>
            <ScoreBar score={undefined} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <MonoLabel size="sm" color={V3.ink400}>LOCKED</MonoLabel>
              <span style={{ color: V3.ink400, fontFamily: V3.bodyFont, fontSize: '12px', fontWeight: V3.fwMedium, lineHeight: 1 }}>
                Upgrade →
              </span>
            </div>
            <ScoreBar locked />
          </>
        )}
      </div>
    </Link>
  );
}

/* ── Group section (SHIFT / Advisory) ──────────────────────────────── */

function PillarSection({
  group,
  codes,
  results,
  userTier,
}: {
  group: PillarGroup;
  codes: string[];
  results: UserLensResultMap;
  userTier: string | null | undefined;
}): React.ReactElement {
  const meta = PILLAR_GROUP_META[group];
  const eyebrowColor = meta.eyebrowColor === 'teal' ? V3.teal600 : V3.ocean600;
  return (
    <section style={{ marginTop: 48 }}>
      <MonoLabel color={eyebrowColor} style={{ display: 'block', marginBottom: 12 }}>
        {meta.eyebrow}
      </MonoLabel>
      <div
        style={{
          fontFamily: V3.displayFont,
          fontSize: '20px',
          fontWeight: V3.fwRegular,
          color: V3.ink900,
          lineHeight: 1.25,
        }}
      >
        {meta.title}
      </div>
      <p style={{
        marginTop: 8,
        fontFamily: V3.bodyFont,
        fontSize: '14px',
        color: V3.ink500,
        lineHeight: 1.6,
        maxWidth: 520,
        marginBottom: 0,
      }}>
        {meta.description}
      </p>

      <div style={{
        marginTop: 32,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 24,
      }}>
        {codes.map((code) => (
          <LensCard
            key={code}
            code={code}
            result={results[code]}
            canAccess={canAccessLens(userTier, code)}
            userTier={userTier}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Summary row (56px height 1px ink-200 top & bottom) ────────────── */

function SummaryRow({
  results,
  tier,
  milesBalance,
}: {
  results: UserLensResultMap;
  tier: string | null;
  milesBalance: number;
}): React.ReactElement {
  const completed = Object.values(results).filter((r) => r && typeof r.score === 'number').length;
  const scored = Object.values(results).filter((r) => r && typeof r.score === 'number').map((r) => r.score);
  const average = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  const locked = ORDERED_LENS_CODES.filter((c) => !canAccessLens(tier, c)).length;

  const cells: Array<{ key: string; label: string; value: React.ReactNode }> = [
    { key: 'completed', label: 'Completed', value: String(completed).padStart(2, '0') },
    { key: 'avg', label: 'Average', value: average != null ? average : '—' },
    { key: 'locked', label: 'Locked', value: String(locked).padStart(2, '0') },
    { key: 'miles', label: 'Miles', value: milesBalance.toLocaleString() },
  ];

  return (
    <div
      style={{
        height: 56,
        borderTop: `1px solid ${V3.border}`,
        borderBottom: `1px solid ${V3.border}`,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {cells.map((c, i) => (
        <div
          key={c.key}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            padding: i === 0 ? '0 16px 0 0' : '0 16px',
            borderLeft: i === 0 ? 'none' : `1px solid ${V3.dividerSurface}`,
          }}
        >
          <MonoLabel size="sm" color={V3.ink400}>{c.label}</MonoLabel>
          <span
            style={{
              fontFamily: V3.displayFont,
              fontSize: '20px',
              fontWeight: V3.fwSemibold,
              color: V3.ink900,
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export function LensesPageV3(): React.ReactElement {
  const { user, profile } = useAuthStore();
  const tier = normalizeTier(profile?.tier) ?? profile?.tier ?? null;
  const milesBalance = (profile as any)?.miles_balance as number | undefined ?? 0;

  const [results, setResults] = useState<UserLensResultMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = await fetchUserLensResults(user?.id ?? null);
      if (cancelled) return;
      setResults(map);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const tierLabel = tierDisplayName(tier);

  return (
    <>
      <PageHeader
        kicker="LENSES LIBRARY"
        title={
          <>Eleven lenses<span style={{ color: V3.fuchsia600 }}>.</span></>
        }
        description="A complete picture of how you operate. Two pillar groups — the five operating lenses of SHIFT, and the six depth instruments of Advisory."
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge variant={
              tier === 'council' || tier === 'enterprise' ? 'tier-council' :
              tier === 'executive' ? 'tier-executive' :
              tier === 'professional' ? 'tier-pro' :
              'status-draft'
            }>{tierLabel}</Badge>
            <Badge variant="count-active" size="regular">{milesBalance.toLocaleString()} miles</Badge>
            <Button variant="secondary" to="/membership">Upgrade</Button>
          </div>
        }
      />

      <div style={{ maxWidth: V3.appContentMax, margin: `${V3.appPageHeaderPad}px auto 0` }}>
        {!loaded ? (
          <div aria-busy style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <Skeleton width="100%" height={56} />

            {/* SHIFT skeleton — 5 cards */}
            <div>
              <Skeleton width={80} height={12} style={{ marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`shift-${i}`} style={{ border: `1px solid ${V3.ink100}`, padding: 20, background: V3.white }}>
                    <Skeleton width={120} height={14} style={{ marginBottom: 10 }} />
                    <Skeleton width={180} height={10} style={{ marginBottom: 18 }} />
                    <Skeleton width="100%" height={10} style={{ marginBottom: 10 }} />
                    <Skeleton width="75%" height={10} style={{ marginBottom: 20 }} />
                    <Skeleton width="100%" height={2} />
                  </div>
                ))}
              </div>
            </div>

            {/* Advisory skeleton — 6 cards */}
            <div>
              <Skeleton width={100} height={12} style={{ marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 8 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`adv-${i}`} style={{ border: `1px solid ${V3.ink100}`, padding: 20, background: V3.white }}>
                    <Skeleton width={120} height={14} style={{ marginBottom: 10 }} />
                    <Skeleton width={180} height={10} style={{ marginBottom: 18 }} />
                    <Skeleton width="100%" height={10} style={{ marginBottom: 10 }} />
                    <Skeleton width="75%" height={10} style={{ marginBottom: 20 }} />
                    <Skeleton width="100%" height={2} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <SummaryRow results={results} tier={tier} milesBalance={milesBalance} />

            <PillarSection
              group="SHIFT"
              codes={SHIFT5_KEYS}
              results={results}
              userTier={tier}
            />

            <PillarSection
              group="Advisory"
              codes={ADVISORY6_KEYS}
              results={results}
              userTier={tier}
            />
          </>
        )}
      </div>
    </>
  );
}

export default LensesPageV3;
