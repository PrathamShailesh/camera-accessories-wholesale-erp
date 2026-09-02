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
import { fetchCurrentUserCached, getCurrentUserCachedSync, fetchWithCache } from '@/lib/client-cache';
import { formatUSD, cloudinaryThumb } from '@/lib/utils';

export default function DepotInventoryPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUserCachedSync()?.user || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [userData, prods] = await Promise.all([
        fetchCurrentUserCached(),
        fetchWithCache<any>('/api/products', undefined, 15000),
      ]);
      if (userData?.authenticated && userData.user) {
        setCurrentUser(userData.user);
      }
      const prodList = Array.isArray(prods) ? prods : prods?.products || [];
      setProducts(prodList);
    } catch {
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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#005E82]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              Depot Stock & Physical Inventory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#005E82]/10 text-[#005E82] border border-[#005E82]/20 font-bold">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Warehouse location: <strong className="text-[#005E82] font-mono">{currentUser?.assignedDepotName || 'Depot'}</strong> • Real-time on-hand stock quantities
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#111827] text-xs hover:bg-[#F8FAFC] self-start sm:self-auto transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E7EB] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by Product Name, SKU code, Brand, Category, or Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] placeholder-[#9CA3AF] text-xs focus:border-[#005E82] focus:bg-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]"
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
                  ? 'bg-[#005E82] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              All SKUs ({products.length})
            </button>
            <button
              onClick={() => setFilterType('IN_STOCK')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'IN_STOCK'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#15803D] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              In Stock ({products.length - outOfStockCount})
            </button>
            <button
              onClick={() => setFilterType('LOW_STOCK')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'LOW_STOCK'
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#B45309] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterType('OUT_OF_STOCK')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'OUT_OF_STOCK'
                  ? 'bg-[#DC2626] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#DC2626] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] font-mono">
            Depot Stock Matrix ({filteredProducts.length} items)
          </h2>
          <span className="text-xs text-[#6B7280] font-mono">
            Threshold: &le; 10 units = Low Stock
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-[#005E82] mx-auto" />
            <p className="text-xs text-[#6B7280]">Loading inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Boxes className="h-10 w-10 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-semibold text-[#111827]">No products found</p>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              No products match your current search query or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-mono uppercase text-[#6B7280]">
                <tr>
                  <th className="p-4">Product / Model</th>
                  <th className="p-4">SKU / Code</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Depot Stock</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-medium">
                {filteredProducts.map((product) => {
                  const stock = product.depotBreakdown?.[depotId] || 0;
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock <= (product.minStockLevel || 10);

                  return (
                    <tr key={product.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cloudinaryThumb(product.imageUrl, 80) || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&q=75&auto=format'}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&q=75&auto=format';
                            }}
                            className="h-10 w-10 rounded-xl object-cover border border-[#E5E7EB] bg-[#F8FAFC] shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-[#111827] line-clamp-1">{product.name}</p>
                            <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                              {product.brand} {product.model ? `• ${product.model}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#005E82] whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="p-4 text-[#4B5563] whitespace-nowrap">
                        {product.categoryName || 'General Optics'}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="font-mono text-base font-bold text-[#111827]">
                          {stock}
                        </span>
                        <span className="text-[#6B7280] text-[10px] block font-mono">
                          units available
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/20">
                            LOW STOCK ({stock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
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
