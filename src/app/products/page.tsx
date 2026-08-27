'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Filter,
  Plus,
  Boxes,
  Barcode,
  ArrowRight,
  TrendingUp,
  Building2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { Product, Category, Depot } from '@/types/erp';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('Canon');
  const [categoryName, setCategoryName] = useState('Camera Bodies');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(5);
  const [trackSerial, setTrackSerial] = useState(true);
  const [minStockLevel, setMinStockLevel] = useState(10);
  const [depotBreakdown, setDepotBreakdown] = useState({
    'dep-blr': 0,
    'dep-dxb': 0,
    'dep-bom': 0,
    'dep-sin': 0,
  });

  const loadData = async () => {
    try {
      const [productsRes, depotsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/depots'),
      ]);
      const productsData = await productsRes.json();
      const depotsData = await depotsRes.json();
      setProducts(productsData);
      setDepots(depotsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku,
          brand,
          categoryName,
          description,
          barcode,
          imageUrl,
          purchasePrice,
          wholesalePrice,
          sellingPrice,
          taxRate,
          trackSerial,
          minStockLevel,
          depotBreakdown,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      setIsModalOpen(false);
      setErrorMessage('');
      setName('');
      setSku('');
      setBrand('Canon');
      setCategoryName('Camera Bodies');
      setDescription('');
      setBarcode('');
      setImageUrl('');
      setPurchasePrice(0);
      setWholesalePrice(0);
      setSellingPrice(0);
      setTaxRate(5);
      setTrackSerial(true);
      setMinStockLevel(10);
      setDepotBreakdown({ 'dep-blr': 0, 'dep-dxb': 0, 'dep-bom': 0, 'dep-sin': 0 });
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create product');
    }
  };

  const brands = ['ALL', 'Canon', 'Sony', 'Nikon', 'RED', 'DJI', 'Aputure', 'SanDisk'];

  const filteredProducts = products.filter((p) => {
    if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Camera & Optics Equipment Catalog
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global catalog with multi-depot stock quantities, serial number flags, wholesale margins and barcodes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU (EOS-R5), Brand, Barcode..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Brand tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedBrand === brand
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400 text-sm">Loading products...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
          const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0) : '0';
          const isLowStock = (p.totalStock || 0) <= p.minStockLevel;

          return (
            <div
              key={p.id}
              className="glass-panel-interactive p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Image & Header */}
                <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-900 border border-slate-800">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-900/90 backdrop-blur-md text-[10px] font-bold text-white border border-slate-700">
                      {p.brand}
                    </span>
                    {p.trackSerial && (
                      <span className="px-2 py-0.5 rounded bg-brand-500/90 text-[10px] font-bold text-white shadow-glow">
                        Serial Tracked
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isLowStock
                          ? 'bg-rose-500/90 text-white shadow-glow'
                          : 'bg-emerald-500/90 text-white'
                      }`}
                    >
                      {p.totalStock} in stock
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-brand-400">{p.sku}</span>
                  <span className="text-[10px] font-mono text-slate-400">Barcode: {p.barcode}</span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{p.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Depot Breakdown Matrix Mini */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 font-mono mb-1.5">
                    <Building2 className="h-3 w-3" />
                    <span>Depot Stock Breakdown</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                    <div className="bg-slate-900 p-1 rounded">
                      <div className="text-slate-500">BLR</div>
                      <div className="font-bold text-white">{p.depotBreakdown?.['dep-blr'] || 0}</div>
                    </div>
                    <div className="bg-slate-900 p-1 rounded">
                      <div className="text-slate-500">DXB</div>
                      <div className="font-bold text-white">{p.depotBreakdown?.['dep-dxb'] || 0}</div>
                    </div>
                    <div className="bg-slate-900 p-1 rounded">
                      <div className="text-slate-500">BOM</div>
                      <div className="font-bold text-white">{p.depotBreakdown?.['dep-bom'] || 0}</div>
                    </div>
                    <div className="bg-slate-900 p-1 rounded">
                      <div className="text-slate-500">SIN</div>
                      <div className="font-bold text-white">{p.depotBreakdown?.['dep-sin'] || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Margins */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">Wholesale Price</div>
                  <div className="text-sm font-bold text-white font-mono">{formatUSD(p.wholesalePrice)}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-emerald-400 font-mono font-semibold">
                    +{margin}% Margin
                  </div>
                  <div className="text-xs text-slate-400 font-mono">MSRP {formatUSD(p.sellingPrice)}</div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Create New Product</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. Canon EOS R5 Mirrorless Camera Body"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                    placeholder="e.g. EOS-R5"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Brand *</label>
                  <select
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="Canon">Canon</option>
                    <option value="Sony">Sony</option>
                    <option value="Nikon">Nikon</option>
                    <option value="RED">RED</option>
                    <option value="DJI">DJI</option>
                    <option value="Aputure">Aputure</option>
                    <option value="SanDisk">SanDisk</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. Camera Bodies"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                    placeholder="e.g. 1234567890123"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  placeholder="e.g. Full-frame mirrorless camera with 45MP sensor"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Purchase Cost *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Wholesale Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MSRP / Selling Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Tax Rate (%) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    step={0.1}
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Min Stock Level *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackSerial}
                      onChange={(e) => setTrackSerial(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-brand-500"
                    />
                    <span>Track Serial Numbers</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Stock by Depot</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Bangalore</label>
                    <input
                      type="number"
                      min={0}
                      value={depotBreakdown['dep-blr']}
                      onChange={(e) => setDepotBreakdown({ ...depotBreakdown, 'dep-blr': Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Dubai</label>
                    <input
                      type="number"
                      min={0}
                      value={depotBreakdown['dep-dxb']}
                      onChange={(e) => setDepotBreakdown({ ...depotBreakdown, 'dep-dxb': Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Mumbai</label>
                    <input
                      type="number"
                      min={0}
                      value={depotBreakdown['dep-bom']}
                      onChange={(e) => setDepotBreakdown({ ...depotBreakdown, 'dep-bom': Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Singapore</label>
                    <input
                      type="number"
                      min={0}
                      value={depotBreakdown['dep-sin']}
                      onChange={(e) => setDepotBreakdown({ ...depotBreakdown, 'dep-sin': Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
