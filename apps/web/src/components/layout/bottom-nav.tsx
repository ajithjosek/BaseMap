'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Layout, Grid3X3, MoreHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  navSections,
  isActivePathname,
  getStoredUserRoles,
  isAdminUser,
  filterSectionsForRoles,
} from '@/lib/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const [moreOpen, setMoreOpen] = useState(false);

  if (pathname === '/login') {
    return null;
  }

  const sections = filterSectionsForRoles(
    navSections,
    isAdminUser(getStoredUserRoles())
  );

  const tabs = [
    { key: 'dashboard', href: '/', icon: Home },
    { key: 'applications', href: '/applications', icon: Layout },
    { key: 'heatmap', href: '/heatmap', icon: Grid3X3 },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white border-t border-slate-800"
      aria-label={tc('navigation')}
    >
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = isActivePathname(pathname, tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors',
                active ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <tab.icon size={20} />
              <span className="truncate max-w-full px-1">{t(tab.key)}</span>
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <MoreHorizontal size={20} />
              <span>{tc('more')}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto">
            <div className="pb-2">
              {sections.map((section) => (
                <div key={section.key} className="mb-3">
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t(section.key)}
                  </div>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          aria-current={isActivePathname(pathname, item.href) ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            'hover:bg-slate-100',
                            isActivePathname(pathname, item.href)
                              ? 'bg-slate-100 font-medium'
                              : 'text-slate-700'
                          )}
                        >
                          <item.icon size={18} className="flex-shrink-0" />
                          <span className="truncate">{t(item.key)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
