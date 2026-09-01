import DepotAppShell from '@/components/layout/DepotAppShell';

export default function DepotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DepotAppShell>{children}</DepotAppShell>;
}
