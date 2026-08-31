'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertTriangle } from 'lucide-react';
import { User, Product } from '@/types/erp';

export default function DepotInventoryPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
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
      } catch {}
    };

    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Depot Inventory</h1>
          <p className="text-slate-400 mt-1">Stock levels at your assigned depot</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Boxes className="h-12 w-12 mx-auto mb-3 text-slate-400/50" />
          <p className="text-slate-400">No products found</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Product</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">SKU</th>
                <th className="text-right p-4 text-sm font-medium text-slate-400">Stock</th>
                <th className="text-right p-4 text-sm font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const depotStock = product.depotBreakdown?.[currentUser?.assignedDepotId || ''] || 0;
                const isLowStock = depotStock < (product.minStockLevel || 10);
                
                return (
                  <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-400 font-mono">{product.sku}</td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {depotStock}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isLowStock ? (
                        <span className="flex items-center gap-1 justify-end text-amber-400 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs">In Stock</span>
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
  );
}
