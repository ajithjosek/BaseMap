import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BaseMap - EAM Tool",
  description: "Enterprise Architecture Management Tool",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value || "";
  const locale = isLocale(raw) ? raw : defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-slate-50`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="flex flex-col md:flex-row">
              <div className="hidden md:block">
                <Sidebar />
              </div>
              <MobileNav />
              <main className="flex-1 min-h-screen overflow-auto p-4 md:p-8 pt-16 md:pt-8">
                {children}
              </main>
            </div>
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}