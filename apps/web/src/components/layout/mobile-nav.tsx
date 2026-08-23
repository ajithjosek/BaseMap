'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold">
        BaseMap
      </Link>
    </div>
  );
}
