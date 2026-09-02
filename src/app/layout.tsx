import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ARIB GLOBAL | Camera & Cine Wholesale ERP',
  description: 'Enterprise Cloud-Based Wholesale ERP for Cameras, Cinema Optics & Accessories. Multi-Depot, Proforma-to-Invoice Automation, Serial Tracking & Cloud Documents.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ARIB GLOBAL',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#f6f7fb',
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
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  }).catch(function() {});
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (let key of keys) {
                      caches.delete(key);
                    }
                  }).catch(function() {});
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-workspace text-ink min-h-screen antialiased">
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
