'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, ArrowLeftRight, Barcode } from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { Product, Depot } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/Input';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodsRes, depsRes] = await Promise.all([
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/depots').then((r) => (r.ok ? r.json() : null)),
      ]);
      if (prodsRes && depsRes) {
        setProducts(Array.isArray(prodsRes) ? prodsRes : []);
        setDepots(Array.isArray(depsRes) ? depsRes : []);
      } else {
        setError('Unable to load inventory data.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStockValuation = products.reduce((sum, p) => sum + (p.totalStock || 0) * p.purchasePrice, 0);
  const totalStockUnits = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
  const lowStockCount = products.filter((p) => (p.totalStock || 0) <= (p.minStockLevel ?? 0)).length;

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="03 / INVENTORY"
        title="Inventory"
        description="Know exactly what is available, where it is stored, and what is moving."
        actions={
          <>
            <LinkButton href="/inventory/serials" variant="outline" iconLeft={<Barcode className="h-4 w-4" />}>
              Serial Registry
            </LinkButton>
            <LinkButton href="/inventory/transfers" iconLeft={<ArrowLeftRight className="h-4 w-4" />}>
              Stock Transfer
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 border border-line rounded-lg divide-x divide-y lg:divide-y-0 divide-line bg-surface">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Inventory Value</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{formatUSD(totalStockValuation)}</div>
          <div className="text-xs text-muted mt-1">Purchase cost basis</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Total Units</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{totalStockUnits.toLocaleString()}</div>
          <div className="text-xs text-muted mt-1">
            Across {depots.length} {depots.length === 1 ? 'depot' : 'depots'}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Tracked SKUs</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{products.length}</div>
          <div className="text-xs text-muted mt-1">Active catalog items</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Low Stock</div>
          <div className={`text-2xl font-semibold mt-1.5 ${lowStockCount > 0 ? 'text-warning' : 'text-ink'}`}>
            {lowStockCount}
          </div>
          <div className="text-xs text-muted mt-1">At or below minimum</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput
          placeholder="Search SKU, product, or brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          wrapperClassName="w-full sm:w-96"
        />
        <span className="text-xs text-muted sm:ml-auto">{filtered.length} products</span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : error ? (
        <ErrorState description={error} action={<Button onClick={loadData}>Try Again</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={products.length === 0 ? 'No stock recorded yet' : 'No matching products'}
          description={
            products.length === 0
              ? 'Add products to the catalog and record opening stock to see inventory here.'
              : 'No products match your search.'
          }
          action={
            products.length === 0 && <LinkButton href="/products">Go to Product Catalog</LinkButton>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              {depots.map((d) => (
                <TableHead key={d.id} align="center">
                  {d.name}
                </TableHead>
              ))}
              <TableHead align="right">Total Stock</TableHead>
              <TableHead align="right">Wholesale Value</TableHead>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const total = p.totalStock || 0;
                const isLow = total <= (p.minStockLevel ?? 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold text-ink">{p.name}</div>
                      <div className="text-xs text-muted font-mono mt-0.5">
                        {p.sku}
                        {p.trackSerial ? ' · serial tracked' : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted">{p.brand}</TableCell>
                    {depots.map((d) => {
                      const qty = p.depotBreakdown?.[d.id] || 0;
                      return (
                        <TableCell key={d.id} align="center">
                          <span className={qty > 0 ? 'font-mono font-semibold text-ink' : 'font-mono text-muted'}>
                            {qty}
                          </span>
                        </TableCell>
                      );
                    })}
                    <TableCell align="right">
                      {isLow ? (
                        <Badge tone="warning">{total} units</Badge>
                      ) : (
                        <span className="font-mono font-semibold text-ink">{total} units</span>
                      )}
                    </TableCell>
                    <TableCell align="right" className="font-mono">
                      {formatUSD(total * p.wholesalePrice)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
