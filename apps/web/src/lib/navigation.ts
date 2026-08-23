import {
  Activity,
  BarChart,
  Cloud,
  Clock,
  Database,
  FileCheck,
  FileDown,
  Gauge,
  GitBranch,
  Grid3X3,
  Home,
  Layout,
  Map,
  Network,
  PenTool,
  Presentation,
  Search,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  icon: LucideIcon;
  key: string;
  href: string;
  adminOnly?: boolean;
}

export interface NavSection {
  key: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    key: 'section_home',
    items: [
      { icon: Home, key: 'dashboard', href: '/' },
      { icon: Presentation, key: 'dashboard_stories', href: '/dashboards/stories' },
    ],
  },
  {
    key: 'section_portfolio',
    items: [
      { icon: Layout, key: 'applications', href: '/applications' },
      { icon: Cloud, key: 'saas', href: '/saas' },
      { icon: Send, key: 'saas_requests', href: '/saas/requests' },
      { icon: Server, key: 'components', href: '/components' },
      { icon: Network, key: 'api_catalog', href: '/interfaces' },
      { icon: Gauge, key: 'tech_standards', href: '/tech-standards' },
    ],
  },
  {
    key: 'section_architecture',
    items: [
      { icon: Database, key: 'capabilities', href: '/capabilities' },
      { icon: Grid3X3, key: 'heatmap', href: '/heatmap' },
      { icon: Share2, key: 'graph_visualization', href: '/graph' },
      { icon: GitBranch, key: 'c4_diagrams', href: '/c4-diagrams' },
    ],
  },
  {
    key: 'section_risk_governance',
    items: [
      { icon: Activity, key: 'eol_risk', href: '/eol-risk' },
      { icon: Shield, key: 'compliance', href: '/compliance' },
      { icon: FileCheck, key: 'data_quality', href: '/data-quality' },
      { icon: Clock, key: 'audit_logs', href: '/audit-logs' },
    ],
  },
  {
    key: 'section_plan_deliver',
    items: [
      { icon: Map, key: 'transformation', href: '/transformation-roadmap' },
      { icon: UsersRound, key: 'resource_allocation', href: '/resource-allocation' },
      { icon: Workflow, key: 'workflows', href: '/workflows' },
    ],
  },
  {
    key: 'section_insights',
    items: [
      { icon: Sparkles, key: 'ai_insights', href: '/insights' },
      { icon: TrendingUp, key: 'advanced_analytics', href: '/advanced-analytics' },
      { icon: Search, key: 'query_builder', href: '/query-builder' },
    ],
  },
  {
    key: 'section_reporting',
    items: [
      { icon: BarChart, key: 'reports', href: '/reports' },
      { icon: PenTool, key: 'report_builder', href: '/reports/builder' },
      { icon: FileDown, key: 'exports', href: '/exports' },
    ],
  },
  {
    key: 'section_admin',
    items: [
      { icon: Users, key: 'users', href: '/users', adminOnly: true },
      { icon: Settings, key: 'settings', href: '/settings', adminOnly: true },
    ],
  },
];

export function isActivePathname(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveSectionKey(
  sections: NavSection[],
  pathname: string
): string | null {
  for (const section of sections) {
    if (section.items.some((item) => isActivePathname(pathname, item.href))) {
      return section.key;
    }
  }
  return null;
}

export function getStoredUserRoles(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('user');
    if (!raw) return [];
    const user = JSON.parse(raw);
    return Array.isArray(user?.roles) ? user.roles : [];
  } catch {
    return [];
  }
}

export function isAdminUser(roleNames: string[]): boolean {
  // Tenants without RBAC data see everything by default.
  if (roleNames.length === 0) return true;
  return roleNames.some((name) => /admin/i.test(name));
}

export function filterSectionsForRoles(
  sections: NavSection[],
  isAdmin: boolean
): NavSection[] {
  if (isAdmin) return sections;
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly),
    }))
    .filter((section) => section.items.length > 0);
}
