export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* We override the root layout entirely by not including the sidebar and header */}
        <main className="w-full h-screen m-0 p-0 overflow-hidden bg-transparent">
          {children}
        </main>
      </body>
    </html>
  );
}
