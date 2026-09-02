'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boxes, AlertTriangle } from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { Product } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

export default function InventoryReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch('/api/products');
      const data = res.ok ? await res.json() : [];
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStock = products.filter((p) => (p.totalStock || 0) <= (p.minStockLevel ?? 0));
  const outOfStock = products.filter((p) => (p.totalStock || 0) === 0);
  // "Overstocked" = holding more than 5x the minimum level, i.e. capital tied up
  // beyond what the reorder threshold implies. Computed from real stock data.
  const overstocked = products.filter(
    (p) => (p.minStockLevel ?? 0) > 0 && (p.totalStock || 0) > (p.minStockLevel ?? 0) * 5
  );

  const totalValue = products.reduce((sum, p) => sum + (p.totalStock || 0) * (p.purchasePrice || 0), 0);

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="06 / ANALYTICS"
        title="Inventory Reports"
        description="Stock valuation, reorder alerts, and capital tied up in slow-moving stock."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 border border-line rounded-lg divide-x divide-y lg:divide-y-0 divide-line bg-surface">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Stock Value</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{formatUSD(totalValue)}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Tracked SKUs</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{products.length}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Low Stock</div>
          <div className={`text-2xl font-semibold mt-1.5 ${lowStock.length > 0 ? 'text-warning' : 'text-ink'}`}>
            {lowStock.length}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Out of Stock</div>
          <div className={`text-2xl font-semibold mt-1.5 ${outOfStock.length > 0 ? 'text-danger' : 'text-ink'}`}>
            {outOfStock.length}
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No inventory to report on"
          description="Add products and record stock to see valuation and reorder analysis here."
          action={<Link href="/products" className="text-sm font-medium text-primary hover:underline">Go to Product Catalog</Link>}
        />
      ) : (
        <>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-xl font-semibold tracking-tight text-ink">Reorder Alerts</h2>
            </div>
            {lowStock.length === 0 ? (
              <Card className="p-5">
                <p className="text-sm text-muted">
                  Every product is above its minimum stock level. Nothing needs reordering right now.
                </p>
              </Card>
            ) : (
              <Card className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead align="right">On Hand</TableHead>
                    <TableHead align="right">Minimum</TableHead>
                    <TableHead align="right">Status</TableHead>
                  </TableHeader>
                  <TableBody>
                    {lowStock.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/products/${p.id}`} className="font-semibold text-ink hover:underline">
                            {p.name}
                          </Link>
                          <div className="text-xs text-muted font-mono mt-0.5">{p.sku}</div>
                        </TableCell>
                        <TableCell className="text-muted">{p.brand}</TableCell>
                        <TableCell align="right" className="font-mono font-semibold">{p.totalStock ?? 0}</TableCell>
                        <TableCell align="right" className="font-mono text-muted">{p.minStockLevel ?? 0}</TableCell>
                        <TableCell align="right">
                          <Badge tone={(p.totalStock || 0) === 0 ? 'danger' : 'warning'}>
                            {(p.totalStock || 0) === 0 ? 'Out of stock' : 'Reorder'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-ink mb-1">Overstocked</h2>
            <p className="text-sm text-muted mb-3">
              Holding more than 5&times; the reorder threshold — capital that may be better deployed elsewhere.
            </p>
            {overstocked.length === 0 ? (
              <Card className="p-5">
                <p className="text-sm text-muted">No products are significantly overstocked.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead align="right">On Hand</TableHead>
                    <TableHead align="right">Minimum</TableHead>
                    <TableHead align="right">Capital Held</TableHead>
                  </TableHeader>
                  <TableBody>
                    {overstocked.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/products/${p.id}`} className="font-semibold text-ink hover:underline">
                            {p.name}
                          </Link>
                          <div className="text-xs text-muted font-mono mt-0.5">{p.sku}</div>
                        </TableCell>
                        <TableCell className="text-muted">{p.brand}</TableCell>
                        <TableCell align="right" className="font-mono font-semibold">{p.totalStock ?? 0}</TableCell>
                        <TableCell align="right" className="font-mono text-muted">{p.minStockLevel ?? 0}</TableCell>
                        <TableCell align="right" className="font-mono">
                          {formatUSD((p.totalStock || 0) * (p.purchasePrice || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
