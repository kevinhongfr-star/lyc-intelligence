// Phase 6.3: Bottom Navigation Component
// Mobile-first responsive navigation

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  Users,
  User,
  MoreHorizontal,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface BottomNavigationProps {
  userRole?: 'candidate' | 'consultant' | 'client' | 'admin';
  notificationCount?: number;
}

export function BottomNavigation({
  userRole = 'consultant',
  notificationCount = 0,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  // Role-specific navigation items
  const getNavItems = (): NavItem[] => {
    switch (userRole) {
      case 'candidate':
        return [
          { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, href: '/candidate' },
          { id: 'mandates', label: 'Jobs', icon: <Briefcase className="w-5 h-5" />, href: '/candidate/mandates' },
          { id: 'applications', label: 'Applied', icon: <Users className="w-5 h-5" />, href: '/candidate/applications' },
          { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, href: '/candidate/profile' },
        ];

      case 'client':
        return [
          { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, href: '/client' },
          { id: 'mandates', label: 'Mandates', icon: <Briefcase className="w-5 h-5" />, href: '/client/mandates' },
          { id: 'pipeline', label: 'Pipeline', icon: <Users className="w-5 h-5" />, href: '/client/pipeline' },
          { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, href: '/client/profile' },
        ];

      case 'consultant':
      case 'admin':
      default:
        return [
          { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, href: '/dashboard' },
          { id: 'mandates', label: 'Mandates', icon: <Briefcase className="w-5 h-5" />, href: '/mandates' },
          { id: 'pipeline', label: 'Pipeline', icon: <Users className="w-5 h-5" />, href: '/pipeline' },
          { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, href: '/profile' },
        ];
    }
  };

  const moreItems: NavItem[] = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, href: '/notifications', badge: notificationCount },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/settings' },
    { id: 'help', label: 'Help', icon: <HelpCircle className="w-5 h-5" />, href: '/help' },
    { id: 'logout', label: 'Log Out', icon: <LogOut className="w-5 h-5" />, href: '/logout' },
  ];

  const navItems = getNavItems();
  const activeItem = navItems.find(item => pathname.startsWith(item.href)) || navItems[0];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col w-64 bg-card border-r border-card-border h-screen sticky top-0">
        {/* Logo */}
        <div className="p-4 border-b border-card-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <span className="font-bold text-lg text-text-primary">DEX AI</span>
              <span className="block text-xs text-text-muted capitalize">{userRole}</span>
            </div>
          </Link>
        </div>

        {/* Main Nav */}
        <div className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-bg-alt hover:text-text-primary'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* More Menu */}
        <div className="p-4 border-t border-card-border space-y-1">
          {moreItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:bg-bg-alt hover:text-text-primary transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-muted'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showMore ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">More</span>
          </button>
        </div>

        {/* More Menu Dropdown */}
        {showMore && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMore(false)}
            />
            <div className="absolute bottom-16 right-4 bg-card rounded-xl shadow-lg border border-card-border z-50 w-56 overflow-hidden">
              {moreItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-alt transition-colors"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>
    </>
  );
}

export default BottomNavigation;
