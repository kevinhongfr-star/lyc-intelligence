import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { V1 } from '@/styles/v1-tokens';
import { useAuthStore } from '@/stores/authStore';
import { fetchMilesBalance } from '@/services/monetizationService';

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: V1.monoFont,
      fontSize: '0.65rem',
      letterSpacing: V1.trackingMono,
      textTransform: 'uppercase',
      color: V1.ink400,
      padding: '12px 8px 8px 8px',
      lineHeight: V1.leadingLabel,
    }}>
      {label}
    </div>
  );
}

function ActiveDot({ color }: { color: string }) {
  return (
    <span style={{
      width: 6,
      height: 6,
      background: color,
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

function EmptyDot() {
  return (
    <span style={{
      width: 6,
      height: 6,
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

interface NavItemProps {
  to: string;
  label: string;
  isActive: boolean;
  dotColor?: string;
  isSubItem?: boolean;
  showDot?: boolean;
  onClick?: () => void;
  monoTeal?: boolean;
}

function NavItem({ to, label, isActive, dotColor, isSubItem, showDot = true, onClick, monoTeal }: NavItemProps) {
  const leftPad = isSubItem ? 36 : 8;
  const activeBg = isActive ? V1.teal50 : 'transparent';
  const activeBorder = isActive ? `1px solid ${V1.teal200}` : '1px solid transparent';
  const textColor = monoTeal ? V1.teal600 : (isSubItem ? V1.ink600 : V1.ink800);
  const fontSize = isSubItem ? 13 : 14;
  const fontFamily = monoTeal ? V1.monoFont : V1.bodyFont;

  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: `8px ${leftPad}px 8px 8px`,
        paddingLeft: isSubItem ? 36 : 8,
        marginLeft: 0,
        background: activeBg,
        border: activeBorder,
        color: textColor,
        textDecoration: 'none',
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: isSubItem ? V1.fwRegular : V1.fwMedium,
        lineHeight: V1.leadingBody,
        cursor: 'pointer',
        transition: `background ${V1.durFast}ms ${V1.ease}`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = V1.ink50;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {showDot && (
        isActive ? <ActiveDot color={dotColor || V1.teal600} /> : <EmptyDot />
      )}
      {!showDot && <EmptyDot />}
      <span>{label}</span>
    </Link>
  );
}

const PRACTICE_DOT_COLORS: Record<string, string> = {
  positioning: V1.fuchsia600,
  influence: V1.teal600,
  transition: V1.teal600,
  'enterprise-china': V1.teal600,
};

export function LeaderNavV5(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuthStore();
  const [milesBalance, setMilesBalance] = useState<number>(4);

  useEffect(() => {
    if (!user?.id) return;
    fetchMilesBalance()
      .then((r) => setMilesBalance(r.balance))
      .catch(() => { /* keep default */ });
  }, [user?.id]);

  const pathname = location.pathname;
  const practiceParam = searchParams.get('practice');

  const isConversationActive = pathname === '/app/nexus' ||
    (pathname.startsWith('/app/nexus') &&
      !pathname.startsWith('/app/nexus/milestones') &&
      !pathname.startsWith('/app/nexus/lenses') &&
      !pathname.startsWith('/app/nexus/readouts') &&
      !pathname.startsWith('/app/nexus/insights') &&
      !pathname.startsWith('/app/nexus/coaching') &&
      !pathname.startsWith('/app/nexus/advisory') &&
      !pathname.startsWith('/app/nexus/quarterly-review') &&
      !pathname.startsWith('/app/nexus/settings') &&
      !pathname.startsWith('/app/nexus/billing'));

  const isMilestonesActive = pathname === '/app/nexus/milestones';
  const isLensesActive = pathname === '/app/nexus/lenses' || pathname === '/app/nexus/readouts';
  const isReadoutsActive = pathname === '/app/nexus/readouts';
  const isAllLensesActive = pathname === '/app/nexus/lenses' && !practiceParam;
  const isInsightsActive = pathname === '/app/nexus/insights';

  const isCoachingActive = pathname.startsWith('/app/nexus/coaching') || pathname === '/app/bookings';
  const isCoachingOverviewActive = pathname === '/app/nexus/coaching';
  const isBookSessionActive = pathname === '/app/nexus/coaching/book';
  const isBookingsActive = pathname === '/app/bookings';
  const isAdvisoryActive = pathname === '/app/nexus/advisory';
  const isQuarterlyReviewActive = pathname === '/app/nexus/quarterly-review';

  const isDexChatActive = pathname === '/app/dex/chat';
  const isDexAssessActive = pathname === '/app/dex/assess';
  const isDexPlanActive = pathname === '/app/dex/plan';
  const isDexBookActive = pathname === '/app/dex/book';
  const isDexJourneyActive = pathname === '/app/dex/journey';
  const isDexStoreActive = pathname === '/app/dex/store';

  const isSettingsActive = pathname === '/app/nexus/settings';
  const isBillingActive = pathname === '/app/nexus/billing';

  const displayName = profile?.name || profile?.email || 'Leader';
  const displayEmail = profile?.email || '';
  const initials = (displayName || 'U').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside
      data-portal-kind="leader-v5"
      style={{
        width: V1.shellSidebarW,
        minWidth: V1.shellSidebarW,
        background: V1.white,
        borderRight: `1px solid ${V1.ink200}`,
        minHeight: '100vh',
        padding: '16px 12px',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand block */}
      <div style={{
        padding: '0 8px 24px 8px',
        borderBottom: `1px solid ${V1.ink100}`,
        marginBottom: 24,
      }}>
        <Link to="/app/nexus" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            fontFamily: V1.displayFont,
            fontSize: 18,
            color: V1.teal700,
            fontWeight: V1.fwBold,
            lineHeight: V1.leadingDisplay,
            letterSpacing: V1.trackingTight,
          }}>
            NEXUS
          </div>
          <div style={{
            fontFamily: V1.monoFont,
            fontSize: V1.textCaption,
            color: V1.ink500,
            marginTop: 2,
            lineHeight: V1.leadingLabel,
          }}>
            leadership clarity
          </div>
        </Link>
      </div>

      {/* Navigation scroll area */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* WORKSPACE */}
        <SectionHeader label="Workspace" />
        <NavItem
          to="/app/nexus"
          label="Conversation"
          isActive={isConversationActive}
        />
        <NavItem
          to="/app/nexus/milestones"
          label="Milestones"
          isActive={isMilestonesActive}
        />
        <NavItem
          to="/app/nexus/lenses"
          label="Lenses"
          isActive={isLensesActive}
          showDot={true}
        />
        {isLensesActive && (
          <>
            <NavItem
              to="/app/nexus/lenses"
              label="All eleven lenses"
              isActive={isAllLensesActive}
              isSubItem={true}
            />
            <NavItem
              to="/app/nexus/readouts"
              label="Your readouts"
              isActive={isReadoutsActive}
              isSubItem={true}
            />
          </>
        )}
        <NavItem
          to="/app/nexus/insights"
          label="Insights"
          isActive={isInsightsActive}
        />

        {/* DEPTH */}
        <SectionHeader label="Depth" />
        {Object.entries({
          positioning: 'Positioning',
          influence: 'Influence',
          transition: 'Transition',
          'enterprise-china': 'Enterprise China',
        }).map(([key, label]) => (
          <NavItem
            key={key}
            to={`/app/nexus/lenses?practice=${key}`}
            label={label}
            isActive={practiceParam === key}
            dotColor={PRACTICE_DOT_COLORS[key]}
          />
        ))}
        <NavItem
          to="/app/nexus/lenses"
          label="All eleven lenses →"
          isActive={false}
          showDot={false}
          monoTeal={true}
        />

        {/* HUMAN LAYER */}
        <SectionHeader label="Human layer" />
        <NavItem
          to="/app/nexus/coaching"
          label="Coaching hours"
          isActive={isCoachingActive}
        />
        {isCoachingActive && (
          <>
            <NavItem
              to="/app/nexus/coaching"
              label="Coaching overview"
              isActive={isCoachingOverviewActive}
              isSubItem={true}
            />
            <NavItem
              to="/app/nexus/coaching/book"
              label="Book a session"
              isActive={isBookSessionActive}
              isSubItem={true}
            />
            <NavItem
              to="/app/bookings"
              label="Upcoming & past"
              isActive={isBookingsActive}
              isSubItem={true}
            />
          </>
        )}
        <NavItem
          to="/app/nexus/advisory"
          label="Advisory sessions"
          isActive={isAdvisoryActive}
        />
        <NavItem
          to="/app/nexus/quarterly-review"
          label="Quarterly deep review"
          isActive={isQuarterlyReviewActive}
        />

        {/* DEX AI */}
        <SectionHeader label="DEX AI" />
        <NavItem to="/app/dex/chat" label="Chat" isActive={isDexChatActive} />
        <NavItem to="/app/dex/assess" label="Assess" isActive={isDexAssessActive} />
        <NavItem to="/app/dex/plan" label="Plan" isActive={isDexPlanActive} />
        <NavItem to="/app/dex/book" label="Book" isActive={isDexBookActive} />
        <NavItem to="/app/dex/journey" label="Journey" isActive={isDexJourneyActive} />
        <NavItem to="/app/dex/store" label="Store" isActive={isDexStoreActive} />

        {/* ACCOUNT */}
        <SectionHeader label="Account" />
        <NavItem to="/app/nexus/settings" label="Settings" isActive={isSettingsActive} />
        <NavItem to="/app/nexus/billing" label="Billing" isActive={isBillingActive} />
      </nav>

      {/* Bottom user block */}
      <div style={{
        borderTop: `1px solid ${V1.ink100}`,
        paddingTop: 16,
        marginTop: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 8px',
          marginBottom: 12,
        }}>
          <div style={{
            width: 32,
            height: 32,
            background: V1.teal700,
            color: V1.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: V1.bodyFont,
            fontSize: 12,
            fontWeight: V1.fwSemibold,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: V1.displayFont,
              fontSize: 14,
              color: V1.ink800,
              fontWeight: V1.fwSemibold,
              lineHeight: V1.leadingHeading,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {displayName}
            </div>
            <div style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              color: V1.ink500,
              lineHeight: V1.leadingLabel,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 1,
            }}>
              {displayEmail}
            </div>
          </div>
        </div>
        <div style={{
          padding: '0 8px',
        }}>
          <span style={{
            display: 'inline-block',
            fontFamily: V1.monoFont,
            fontSize: '0.7rem',
            color: V1.teal700,
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            lineHeight: V1.leadingLabel,
            fontWeight: V1.fwMedium,
          }}>
            {milesBalance} mi available
          </span>
        </div>
      </div>
    </aside>
  );
}

export default LeaderNavV5;
