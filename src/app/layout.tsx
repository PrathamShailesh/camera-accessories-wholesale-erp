import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'LensCore | Camera & Accessories Wholesale ERP',
  description: 'Enterprise Cloud-Based Wholesale ERP for Cameras, Cinema Optics & Accessories. Multi-Depot, Proforma-to-Invoice Automation, Serial Tracking & Cloud Documents.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LensCore ERP',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
