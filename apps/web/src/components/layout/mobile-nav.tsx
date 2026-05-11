'use client';

import { useState } from 'react';
import { Menu, X, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { label: 'Applications', href: '/applications' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'C2A Heatmap', href: '/heatmap' },
  { label: 'SaaS & Cloud', href: '/saas' },
  { label: 'SaaS Requests', href: '/saas/requests' },
  { label: 'API Catalog', href: '/interfaces' },
  { label: 'Components', href: '/components' },
  { label: 'EOL Risk', href: '/eol-risk' },
  { label: 'Data Quality', href: '/data-quality' },
  { label: 'Query Builder', href: '/query-builder' },
  { label: 'AI Insights', href: '/insights' },
  { label: 'Advanced Analytics', href: '/advanced-analytics' },
  { label: 'Exports', href: '/exports' },
  { label: 'Audit Logs', href: '/audit-logs' },
  { label: 'Transformation', href: '/transformation-roadmap' },
  { label: 'Reports', href: '/reports' },
  { label: 'Report Builder', href: '/reports/builder' },
  { label: 'Users', href: '/users' },
  { label: 'Settings', href: '/settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold">
        BaseMap
      </Link>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-slate-900 text-white p-0">
          <div className="p-4 border-b border-slate-800">
            <span className="text-xl font-bold">BaseMap</span>
          </div>
          <nav className="p-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors',
                  pathname === item.href ? 'bg-slate-800 text-white' : 'text-slate-300'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}