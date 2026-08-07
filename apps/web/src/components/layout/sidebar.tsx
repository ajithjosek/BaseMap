'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Layout, Database, Cloud, BarChart, Settings, Users, Grid3X3, PenTool, Network, Send, Server, Activity, FileCheck, Search, Map, Sparkles, TrendingUp, FileDown, Clock, Shield, UsersRound, Share2, Presentation, Webhook, Workflow, GitBranch, Gauge } from 'lucide-react';
import { NotificationCenter } from './notification-center';
import { LocaleSwitcher } from './locale-switcher';

const menuItems = [
  { icon: Home, key: 'dashboard', href: '/' },
  { icon: Presentation, key: 'dashboard_stories', href: '/dashboards/stories' },
  { icon: Layout, key: 'applications', href: '/applications' },
  { icon: Database, key: 'capabilities', href: '/capabilities' },
  { icon: Grid3X3, key: 'heatmap', href: '/heatmap' },
  { icon: Cloud, key: 'saas', href: '/saas' },
  { icon: Send, key: 'saas_requests', href: '/saas/requests' },
  { icon: Network, key: 'api_catalog', href: '/interfaces' },
  { icon: Server, key: 'components', href: '/components' },
  { icon: Webhook, key: 'graphql_api', href: 'http://localhost:4000/graphql' },
  { icon: Activity, key: 'eol_risk', href: '/eol-risk' },
  { icon: FileCheck, key: 'data_quality', href: '/data-quality' },
  { icon: Search, key: 'query_builder', href: '/query-builder' },
  { icon: Sparkles, key: 'ai_insights', href: '/insights' },
  { icon: TrendingUp, key: 'advanced_analytics', href: '/advanced-analytics' },
  { icon: FileDown, key: 'exports', href: '/exports' },
  { icon: UsersRound, key: 'resource_allocation', href: '/resource-allocation' },
  { icon: Shield, key: 'compliance', href: '/compliance' },
  { icon: Clock, key: 'audit_logs', href: '/audit-logs' },
  { icon: Map, key: 'transformation', href: '/transformation-roadmap' },
  { icon: Share2, key: 'graph_visualization', href: '/graph' },
  { icon: Workflow, key: 'workflows', href: '/workflows' },
  { icon: Gauge, key: 'tech_standards', href: '/tech-standards' },
  { icon: GitBranch, key: 'c4_diagrams', href: '/c4-diagrams' },
  { icon: BarChart, key: 'reports', href: '/reports' },
  { icon: PenTool, key: 'report_builder', href: '/reports/builder' },
  { icon: Users, key: 'users', href: '/users' },
  { icon: Settings, key: 'settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
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
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white ${
                  pathname === item.href ? 'bg-slate-800 text-white' : ''
                }`}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className="truncate">{t(item.key)}</span>
              </Link>
            </li>
          ))}
        </ul>
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
