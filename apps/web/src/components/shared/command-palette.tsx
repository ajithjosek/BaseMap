'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { navSections } from '@/lib/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Layout, Database, Network, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaletteResult {
  id: string;
  label: string;
  group: 'pages' | 'applications' | 'capabilities' | 'interfaces';
  href: string;
  sectionLabel?: string;
}

interface EntityRef {
  id: string;
  name?: string;
}

const GROUP_ICONS = {
  pages: Layout,
  applications: Layout,
  capabilities: Database,
  interfaces: Network,
};

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tp = useTranslations('palette');

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PaletteResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === '/login') return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, pathname]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const pageResults = useMemo<PaletteResult[]>(() => {
    const q = query.trim().toLowerCase();
    return navSections
      .flatMap((section) =>
        section.items.map((item) => ({
          item,
          sectionLabel: t(section.key),
          label: t(item.key),
        }))
      )
      .filter(({ label }) => !q || label.toLowerCase().includes(q))
      .slice(0, 8)
      .map(({ item, sectionLabel, label }) => ({
        id: `page-${item.key}`,
        label,
        group: 'pages' as const,
        href: item.href,
        sectionLabel,
      }));
  }, [query, t]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [appsRes, ifacesRes, capsRes] = await Promise.all([
          api.get(`/applications?search=${encodeURIComponent(q)}&limit=5`),
          api.get(`/interfaces?search=${encodeURIComponent(q)}`),
          api.get('/capabilities/tree'),
        ]);

        if (cancelled) return;

        const toEntities = (payload: unknown): EntityRef[] => {
          const data = (payload as { data?: unknown })?.data ?? payload;
          return Array.isArray(data) ? data : [];
        };

        const apps: PaletteResult[] = toEntities(appsRes.data)
          .slice(0, 5)
          .map((a) => ({
            id: `app-${a.id}`,
            label: a.name ?? '',
            group: 'applications' as const,
            href: `/applications/${a.id}`,
          }));

        const caps: PaletteResult[] = toEntities(capsRes.data)
          .filter((c) => c.name?.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((c) => ({
            id: `cap-${c.id}`,
            label: c.name ?? '',
            group: 'capabilities' as const,
            href: '/capabilities',
          }));

        const ifaces: PaletteResult[] = toEntities(ifacesRes.data)
          .slice(0, 5)
          .map((i) => ({
            id: `iface-${i.id}`,
            label: i.name ?? '',
            group: 'interfaces' as const,
            href: '/interfaces',
          }));

        setResults([...apps, ...caps, ...ifaces]);
        setActiveIndex(0);
      } catch {
        // entity search is best-effort; page results still work offline
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const allResults = useMemo(
    () => [...pageResults, ...results],
    [pageResults, results]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, PaletteResult[]> = {};
    for (const r of allResults) {
      (groups[r.group] ||= []).push(r);
    }
    return groups;
  }, [allResults]);

  useEffect(() => {
    const activeId = allResults[activeIndex]?.id;
    if (!activeId) return;
    listRef.current
      ?.querySelector(`[data-result-id="${CSS.escape(activeId)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, allResults]);

  const select = useCallback(
    (result: PaletteResult) => {
      setOpen(false);
      router.push(result.href);
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const result = allResults[activeIndex];
      if (result) select(result);
    }
  }

  const groupLabels: Record<string, string> = {
    pages: tp('pages'),
    applications: tp('applications'),
    capabilities: tp('capabilities'),
    interfaces: tp('interfaces'),
  };

  if (pathname === '/login') {
    return null;
  }

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[20%] translate-y-0 max-w-xl p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{tp('title')}</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={tp('placeholder')}
            className="w-full py-3.5 bg-transparent text-sm outline-none placeholder:text-slate-400"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={allResults[activeIndex]?.id}
          />
          <kbd className="text-[10px] font-semibold text-slate-400 border rounded px-1.5 py-0.5 flex-shrink-0">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2" id="command-palette-list" role="listbox">
          {allResults.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              {query ? tp('no_results') : tp('hint')}
            </p>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {groupLabels[group]}
              </div>
              {items.map((result) => {
                flatIndex += 1;
                const isActive = flatIndex === activeIndex;
                const Icon = GROUP_ICONS[result.group as keyof typeof GROUP_ICONS] ?? Layout;
                return (
                  <button
                    key={result.id}
                    type="button"
                    data-result-id={result.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => select(result)}
                    onMouseEnter={() => setActiveIndex(allResults.indexOf(result))}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                      isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{result.label}</span>
                    {result.group === 'pages' && (
                      <span className="text-xs text-slate-300 truncate hidden sm:inline">
                        {result.sectionLabel}
                      </span>
                    )}
                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
