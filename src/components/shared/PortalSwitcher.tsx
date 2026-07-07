import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface Portal {
  id: string;
  label: string;
  path: string;
}

const PORTALS: Portal[] = [
  { id: 'internal', label: 'Internal Portal', path: '/platform' },
  { id: 'client', label: 'Client Portal', path: '/client-portal/overview' },
  { id: 'leader', label: 'Leader Portal', path: '/leader-portal/coach' },
  { id: 'candidate', label: 'Candidate Portal', path: '/candidate/dashboard' },
];

export function PortalSwitcher() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPortal, setCurrentPortal] = useState<Portal>(PORTALS[0]);

  useEffect(() => {
    const portal = PORTALS.find(p => location.pathname.startsWith(p.path)) || PORTALS[0];
    setCurrentPortal(portal);
  }, [location.pathname]);

  const role = profile?.role || 'consultant';
  if (role !== 'admin') return null;

  const handlePortalSelect = (portal: Portal) => {
    setCurrentPortal(portal);
    setIsOpen(false);
    navigate(portal.path);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary border border-bg-tertiary text-text-primary text-sm font-medium transition-colors"
      >
        <span>{currentPortal.label}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-56 bg-bg-primary border border-bg-tertiary z-50">
            {PORTALS.map((portal) => (
              <button
                key={portal.id}
                onClick={() => handlePortalSelect(portal)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  currentPortal.id === portal.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <span className="w-2 h-2 bg-accent" style={{ opacity: currentPortal.id === portal.id ? 1 : 0 }} />
                {portal.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}