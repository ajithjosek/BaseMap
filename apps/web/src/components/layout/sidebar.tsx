'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { navSections, isActivePathname, findActiveSectionKey } from '@/lib/navigation';
import { NotificationCenter } from './notification-center';
import { LocaleSwitcher } from './locale-switcher';

const STORAGE_KEY = 'basemap.nav.collapsed-sections';

function readCollapsedSections(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isLoginPage = pathname === '/login';

  const [collapsed, setCollapsed] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readCollapsedSections()
  );

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('access_token'));
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, [pathname]);

  const activeSectionKey = findActiveSectionKey(pathname);

  function toggleSection(sectionKey: string) {
    setCollapsed((prev) => {
      const next = prev.includes(sectionKey)
        ? prev.filter((k) => k !== sectionKey)
        : [...prev, sectionKey];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // persistence is best-effort
      }
      return next;
    });
  }

  if (isLoginPage || !isAuthenticated) {
    return null;
  }

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-slate-800">
        BaseMap
      </div>
      <nav className="flex-1 p-3 overflow-y-auto" aria-label={tc('navigation')}>
        {navSections.map((section) => {
          const hasActive = section.key === activeSectionKey;
          const isOpen = !collapsed.includes(section.key) || hasActive;
          return (
            <div key={section.key} className="mb-1">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                aria-expanded={isOpen}
                className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  hasActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="truncate">{t(section.key)}</span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {isOpen && (
                <ul className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={isActivePathname(pathname, item.href) ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white ${
                          isActivePathname(pathname, item.href) ? 'bg-slate-800 text-white' : ''
                        }`}
                      >
                        <item.icon size={18} className="flex-shrink-0" />
                        <span className="truncate">{t(item.key)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg mb-2">
          <NotificationCenter />
          <LocaleSwitcher />
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="text-sm min-w-0">
            <p className="font-medium text-white truncate">
              {user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}` : tc('user')) : tc('loading')}
            </p>
            <p className="text-slate-400 text-xs truncate">{user?.email || '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
