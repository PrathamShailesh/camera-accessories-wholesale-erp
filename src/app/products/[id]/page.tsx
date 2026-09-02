'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Barcode,
  Building2,
  Boxes,
  ArrowLeftRight,
  Image as ImageIcon,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD } from '@/lib/utils';
import { Product, SerialNumber } from '@/types/erp';
import { Card } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { MarginBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [serials, setSerials] = useState<SerialNumber[]>([]);

  const loadData = () => {
    const p = dataStore.getProductById(id);
    if (p) {
      setProduct(p);
      setSerials(dataStore.getSerialNumbers(p.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!product) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-500 text-sm font-semibold">Product model not found</div>
        <LinkButton href="/products" variant="outline" size="sm">
          Back to Product Catalog
        </LinkButton>
      </div>
    );
  }

  const marginVal = product.sellingPrice - product.purchasePrice;
  const marginPct = Number(((marginVal / product.sellingPrice) * 100).toFixed(1));

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        eyebrow="03 / INVENTORY"
        breadcrumbs={[{ label: 'Products', href: '/products' }, { label: product.name }]}
        title={
          <span className="inline-flex items-center gap-2.5">
            {product.name}
            <span className="font-mono text-xs text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-200 align-middle">
              {product.sku}
            </span>
          </span>
        }
        description={`Brand: ${product.brand} · Category: ${product.categoryName} · Barcode: ${product.barcode}`}
        actions={
          <LinkButton href="/inventory/transfers" iconLeft={<ArrowLeftRight className="h-4 w-4" />} size="sm">
            Transfer Stock
          </LinkButton>
        }
      />

      {/* Main Specs & Image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 overflow-hidden h-64 flex items-center justify-center bg-slate-50">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-slate-400" />
          )}
        </Card>

        <Card className="md:col-span-2 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Product Record & Technical Specifications
            </h3>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Cost Price</span>
              <span className="text-slate-900 font-bold">{formatUSD(product.purchasePrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Wholesale Price</span>
              <span className="text-slate-900 font-bold">{formatUSD(product.wholesalePrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Gross Margin</span>
              <MarginBadge marginPercent={marginPct} />
            </div>
          </div>
        </Card>
      </div>

      {/* Depot Distribution Grid */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Inventory Distribution Across Depots
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-sans">Central Depot Stock</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {product.depotBreakdown?.['dep-central'] ?? product.totalStock ?? 0} Units
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-sans">Total Available Stock</span>
            <div className="text-xl font-bold text-primary mt-1">
              {product.totalStock ?? 0} Units
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
