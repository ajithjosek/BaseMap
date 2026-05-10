'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layout, Database, Cloud, BarChart, Settings, Users, Grid3X3, PenTool } from 'lucide-react';
import { NotificationCenter } from './notification-center';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Layout, label: 'Applications', href: '/applications' },
  { icon: Database, label: 'Capabilities', href: '/capabilities' },
  { icon: Grid3X3, label: 'C2A Heatmap', href: '/heatmap' },
  { icon: Cloud, label: 'SaaS & Cloud', href: '/saas' },
  { icon: BarChart, label: 'Reports', href: '/reports' },
  { icon: PenTool, label: 'Report Builder', href: '/reports/builder' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isLoginPage = pathname === '/login';
  
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('access_token'));
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, [pathname]);
  
  if (isLoginPage || !isAuthenticated) {
    return null;
  }

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-slate-800">
        BaseMap
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors ${
                  pathname === item.href ? 'bg-slate-800' : ''
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-3 py-2">
          <NotificationCenter />
        </div>
        <div className="flex items-center gap-3 p-3 mt-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-200">
              {user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User') : 'Loading...'}
            </p>
            <p className="text-slate-400">{user?.email || '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
