'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layout, Database, Cloud, BarChart, Settings, Users, Grid3X3, PenTool, Network, Send, Server, Activity, FileCheck, Search, Map, Sparkles, TrendingUp } from 'lucide-react';
import { NotificationCenter } from './notification-center';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Layout, label: 'Applications', href: '/applications' },
  { icon: Database, label: 'Capabilities', href: '/capabilities' },
  { icon: Grid3X3, label: 'C2A Heatmap', href: '/heatmap' },
  { icon: Cloud, label: 'SaaS & Cloud', href: '/saas' },
  { icon: Send, label: 'SaaS Requests', href: '/saas/requests' },
  { icon: Network, label: 'API Catalog', href: '/interfaces' },
  { icon: Server, label: 'Components', href: '/components' },
  { icon: Activity, label: 'EOL Risk', href: '/eol-risk' },
  { icon: FileCheck, label: 'Data Quality', href: '/data-quality' },
  { icon: Search, label: 'Query Builder', href: '/query-builder' },
  { icon: Sparkles, label: 'AI Insights', href: '/insights' },
  { icon: TrendingUp, label: 'Advanced Analytics', href: '/advanced-analytics' },
  { icon: Map, label: 'Transformation', href: '/transformation-roadmap' },
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
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white ${
                  pathname === item.href ? 'bg-slate-800 text-white' : ''
                }`}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg mb-2">
          <NotificationCenter />
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="text-sm min-w-0">
            <p className="font-medium text-white truncate">
              {user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User') : 'Loading...'}
            </p>
            <p className="text-slate-400 text-xs truncate">{user?.email || '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
