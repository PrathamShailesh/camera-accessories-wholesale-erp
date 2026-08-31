import type { Metadata } from 'next';
import '../globals.css';
import DepotAppShell from '@/components/layout/DepotAppShell';

export const metadata: Metadata = {
  title: 'LensCore Depot | Warehouse Fulfilment System',
  description: 'Depot Warehouse Fulfilment System for LensCore ERP. Order picking, packing, shipping, and inventory management.',
};

export default function DepotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <DepotAppShell>
          {children}
        </DepotAppShell>
      </body>
    </html>
  );
}
