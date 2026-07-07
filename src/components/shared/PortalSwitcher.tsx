/**
 * PortalSwitcher — Admin dropdown to navigate between portals
 * Accessible from top nav bar when user has admin role.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ChevronDown, Building2, Users, User, Briefcase } from 'lucide-react';

const DS = {
  accent: '#C108AB',
  text: '#000000',
  muted: '#666666',
  border: '#E5E5E5',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  bodyFont: "'DM Sans', system-ui, sans-serif",
  headingFont: "'Libre Baskerville', Georgia, serif",
};

interface PortalOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const PORTALS: PortalOption[] = [
  {
    id: 'internal',
    label: 'Internal Portal',
    icon: <Briefcase style={{ width: 16, height: 16 }} />,
    path: '/platform',
    description: 'Consultant tools & platform',
  },
  {
    id: 'client',
    label: 'Client Portal (B2B)',
    icon: <Building2 style={{ width: 16, height: 16 }} />,
    path: '/client-portal/overview',
    description: 'Client-facing dashboard',
  },
  {
    id: 'leader',
    label: 'Leader Portal (B2C)',
    icon: <User style={{ width: 16, height: 16 }} />,
    path: '/leader-portal/coach',
    description: 'Executive coaching interface',
  },
  {
    id: 'candidate',
    label: 'Candidate Portal',
    icon: <Users style={{ width: 16, height: 16 }} />,
    path: '/candidate/dashboard',
    description: 'Candidate experience',
  },
];

export function PortalSwitcher() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show for admin users
  const role = profile?.role;
  if (role !== 'admin') return null;

  // Determine current portal
  const currentPortal = PORTALS.find(p => location.pathname.startsWith(p.path)) || PORTALS[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: isOpen ? DS.bgAlt : 'transparent',
          border: `1px solid ${DS.border}`,
          cursor: 'pointer',
          fontFamily: DS.bodyFont,
          fontSize: '13px',
          fontWeight: 500,
          color: DS.text,
          transition: 'background 0.15s ease',
        }}
      >
        {currentPortal.icon}
        <span>{currentPortal.label}</span>
        <ChevronDown style={{
          width: 14,
          height: 14,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s ease',
        }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          background: DS.bg,
          border: `1px solid ${DS.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minWidth: '260px',
          zIndex: 1000,
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${DS.border}`,
            fontFamily: DS.bodyFont,
            fontSize: '11px',
            fontWeight: 600,
            color: DS.muted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Switch Portal
          </div>
          {PORTALS.map(portal => (
            <button
              key={portal.id}
              onClick={() => {
                navigate(portal.path);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                background: currentPortal.id === portal.id ? `${DS.accent}08` : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${DS.border}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPortal.id !== portal.id) {
                  e.currentTarget.style.background = DS.bgAlt;
                }
              }}
              onMouseLeave={(e) => {
                if (currentPortal.id !== portal.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentPortal.id === portal.id ? `${DS.accent}15` : DS.bgAlt,
                color: currentPortal.id === portal.id ? DS.accent : DS.muted,
                flexShrink: 0,
              }}>
                {portal.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  fontWeight: currentPortal.id === portal.id ? 600 : 400,
                  color: DS.text,
                }}>
                  {portal.label}
                </div>
                <div style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '11px',
                  color: DS.muted,
                }}>
                  {portal.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
