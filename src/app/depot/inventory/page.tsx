'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  RefreshCw,
  Building2,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { User, Product } from '@/types/erp';
import { formatUSD } from '@/lib/utils';

export default function DepotInventoryPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    let user: User | null = null;

    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.authenticated && userData.user) {
          user = userData.user;
          setCurrentUser(user);
        }
      }
    } catch {}

    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const allProducts = await res.json();
        setProducts(allProducts);
      }
    } catch (e) {
      console.error('Error loading inventory:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const depotId = currentUser?.assignedDepotId || 'dep-dxb';

  const filteredProducts = products.filter((p) => {
    const depotStock = p.depotBreakdown?.[depotId] || 0;
    const isLow = depotStock > 0 && depotStock <= (p.minStockLevel || 10);
    const isOut = depotStock === 0;

    if (filterType === 'IN_STOCK' && isOut) return false;
    if (filterType === 'LOW_STOCK' && !isLow) return false;
    if (filterType === 'OUT_OF_STOCK' && !isOut) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchCat = p.categoryName?.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      return matchName || matchSku || matchBrand || matchCat || matchBarcode;
    }

    return true;
  });

  const lowStockCount = products.filter((p) => {
    const stock = p.depotBreakdown?.[depotId] || 0;
    return stock > 0 && stock <= (p.minStockLevel || 10);
  }).length;

  const outOfStockCount = products.filter((p) => {
    const stock = p.depotBreakdown?.[depotId] || 0;
    return stock === 0;
  }).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Depot Stock & Physical Inventory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-emerald-400 border border-slate-700">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Warehouse location: <strong className="text-emerald-400 font-mono">{currentUser?.assignedDepotName || 'Depot'}</strong> • Real-time on-hand stock quantities
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs hover:bg-slate-800 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product Name, SKU code, Brand, Category, or Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All SKUs ({products.length})
            </button>
            <button
              onClick={() => setFilterType('IN_STOCK')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'IN_STOCK'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-brand-400 border border-slate-800'
              }`}
            >
              In Stock ({products.length - outOfStockCount})
            </button>
            <button
              onClick={() => setFilterType('LOW_STOCK')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'LOW_STOCK'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-800'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterType('OUT_OF_STOCK')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Depot Stock Matrix ({filteredProducts.length} items)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Threshold: &le; 10 units = Low Stock
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-400">Loading inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Boxes className="h-10 w-10 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">No products found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No products match your current search query or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="p-4">Product / Model</th>
                  <th className="p-4">SKU / Code</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Depot Stock</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProducts.map((product) => {
                  const stock = product.depotBreakdown?.[depotId] || 0;
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock <= (product.minStockLevel || 10);

                  return (
                    <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'}
                            alt={product.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800';
                            }}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-800 bg-slate-950 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-white line-clamp-1">{product.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {product.brand} {product.model ? `• ${product.model}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-brand-400 whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {product.categoryName || 'General Optics'}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="font-mono text-base font-bold text-white">
                          {stock}
                        </span>
                        <span className="text-slate-500 text-[10px] block font-mono">
                          units available
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            LOW STOCK ({stock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            IN STOCK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
