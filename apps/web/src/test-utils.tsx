import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple next-intl mock
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, string> = {
      'status.operational': 'Operational',
      'status.active': 'Active',
      'status.degraded': 'Degraded',
      'status.down': 'Down',
      'status.draft': 'Draft',
      'status.pending': 'Pending',
      'status.retired': 'Retired',
      'status.unknown_status': 'Unknown Status',
      'navigation': 'Navigation',
      'common.more': 'More',
    };
    const fn = (key: string) => translations[`${namespace}.${key}`] || key;
    fn.has = (key: string) => `${namespace}.${key}` in translations;
    return fn;
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return React.forwardRef<HTMLAnchorElement, any>(({ children, href, ...props }, ref) => (
    <a ref={ref} href={href} {...props}>
      {children}
    </a>
  ));
});

// Mock @/components/ui/badge
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-variant={variant} className={className}>{children}</span>
  ),
}));

// Mock @/components/ui/button
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} {...props}>{children}</button>
  )),
}));

// Mock @/components/ui/sheet
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, ...props }: any) => <div data-testid="sheet" {...props}>{children}</div>,
  SheetContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, options);
}

export * from '@testing-library/react';
export { customRender as render };
