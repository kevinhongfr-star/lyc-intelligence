import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function ImpersonationBanner() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const role = profile?.role || 'consultant';
    const isInternal = location.pathname.startsWith('/platform');
    setShow(role === 'admin' && !isInternal);
  }, [profile?.role, location.pathname]);

  if (!show) return null;

  const getRoleName = () => {
    if (location.pathname.startsWith('/client-portal')) return 'Client';
    if (location.pathname.startsWith('/leader-portal')) return 'Leader';
    if (location.pathname.startsWith('/candidate')) return 'Candidate';
    return 'User';
  };

  const handleReturn = () => {
    navigate('/platform');
  };

  return (
    <div className="bg-accent h-8 flex items-center justify-between px-6">
      <span className="text-white text-sm font-medium">
        Admin View — Viewing as {getRoleName()}
      </span>
      <button
        onClick={handleReturn}
        className="flex items-center gap-2 text-white text-sm font-medium border border-white hover:bg-white/10 px-3 py-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Internal Portal
      </button>
    </div>
  );
}