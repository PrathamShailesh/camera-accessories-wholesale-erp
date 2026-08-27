'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPortal = pathname === '/login' || pathname?.startsWith('/quote') || pathname?.startsWith('/portal') || pathname?.startsWith('/view');

  if (isPublicPortal) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
