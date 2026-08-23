'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { navSections, isActivePathname } from '@/lib/navigation';

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold">
        BaseMap
      </Link>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white" aria-label={tc('navigation')}>
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-slate-900 text-white p-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <span className="text-xl font-bold">BaseMap</span>
          </div>
          <nav className="p-2" aria-label={tc('navigation')}>
            {navSections.map((section) => (
              <div key={section.key} className="mb-2">
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t(section.key)}
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={isActivePathname(pathname, item.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white',
                          isActivePathname(pathname, item.href) && 'bg-slate-800 text-white'
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
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
