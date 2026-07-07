/**
 * SubTabBar — Reusable sub-tab navigation component
 * Used across all portals for sub-tab navigation
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DS = {
  accent: '#C108AB',
  text: '#000000',
  muted: '#666666',
  border: '#E5E5E5',
  bodyFont: "'DM Sans', system-ui, sans-serif",
};

export interface SubTab {
  id: string;
  label: string;
  path: string;
  badge?: number;
}

interface SubTabBarProps {
  tabs: SubTab[];
  basePath: string;
}

export function SubTabBar({ tabs, basePath }: SubTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find(tab => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')) || tabs[0];

  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${DS.border}`,
      overflowX: 'auto',
      gap: 0,
    }}>
      {tabs.map(tab => {
        const isActive = activeTab.id === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              padding: '12px 20px',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? DS.accent : DS.muted,
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? `2px solid ${DS.accent}` : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, border-color 0.15s ease',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = DS.text;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = DS.muted;
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                background: DS.accent,
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 600,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
