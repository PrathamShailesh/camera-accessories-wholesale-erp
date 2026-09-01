'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Package,
  Search,
  Plus,
  FileSpreadsheet,
  Boxes,
  Barcode,
  TrendingUp,
  Building2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  Image as ImageIcon,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { formatUSD, cloudinaryThumb } from '@/lib/utils';
import { Product, Depot } from '@/types/erp';
import ImageUploadField from '@/components/ui/ImageUploadField';

const BulkProductImportModal = dynamic(() => import('@/components/products/BulkProductImportModal'), { ssr: false });

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  // Edit form fields
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState<number>(0);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editTaxRate, setEditTaxRate] = useState<number>(5);
  const [editMinStockLevel, setEditMinStockLevel] = useState<number>(10);
  const [editTrackSerial, setEditTrackSerial] = useState<boolean>(true);
  const [editDepotBreakdown, setEditDepotBreakdown] = useState<Record<string, number>>({
    'dep-central': 0,
  });

  // Delete product state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Form fields for Create Product Modal
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('Canon');
  const [model, setModel] = useState('');
  const [categoryName, setCategoryName] = useState('Camera Bodies');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(5);
  const [trackSerial, setTrackSerial] = useState<boolean>(true);
  const [minStockLevel, setMinStockLevel] = useState<number>(10);
  const [depotBreakdown, setDepotBreakdown] = useState<Record<string, number>>({
    'dep-central': 0,
  });

  const loadData = async () => {
    setError(null);
    try {
      const [productsRes, depotsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/depots'),
      ]);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        setError('Failed to load products');
      }
      if (depotsRes.ok) {
        const depotsData = await depotsRes.json();
        setDepots(Array.isArray(depotsData) ? depotsData : []);
      }
    } catch (error) {
      console.error('Error loading products from database:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !sku.trim() || !brand.trim()) {
      setErrorMessage('Please fill in all mandatory fields (Name, SKU, Brand).');
      return;
    }

    if (purchasePrice < 0 || wholesalePrice < 0 || sellingPrice < 0) {
      setErrorMessage('Pricing fields cannot be negative numbers.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          brand: brand.trim(),
          model: model.trim(),
          categoryName: categoryName.trim(),
          description: description.trim(),
          barcode: barcode.trim(),
          imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
          purchasePrice: Number(purchasePrice),
          wholesalePrice: Number(wholesalePrice),
          sellingPrice: Number(sellingPrice),
          taxRate: Number(taxRate),
          trackSerial,
          minStockLevel: Number(minStockLevel),
          depotBreakdown,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product to database');
      }

      setSuccessMessage(`Product ${sku.toUpperCase()} created successfully in database.`);
      await loadData();

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
        setName('');
        setSku('');
        setBrand('Canon');
        setModel('');
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
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create product in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Open edit modal and pre-fill all fields ──────────────────────────────
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditBrand(p.brand);
    setEditModel(p.model || '');
    setEditCategoryName(p.categoryName || 'Camera Bodies');
    setEditDescription(p.description || '');
    setEditImageUrl(p.imageUrl || '');
    setEditPurchasePrice(p.purchasePrice);
    setEditWholesalePrice(p.wholesalePrice);
    setEditSellingPrice(p.sellingPrice);
    setEditTaxRate(p.taxRate ?? 5);
    setEditMinStockLevel(p.minStockLevel ?? 10);
    setEditTrackSerial(p.trackSerial ?? true);
    setEditDepotBreakdown({
      'dep-blr': p.depotBreakdown?.['dep-blr'] ?? 0,
      'dep-dxb': p.depotBreakdown?.['dep-dxb'] ?? 0,
      'dep-bom': p.depotBreakdown?.['dep-bom'] ?? 0,
      'dep-sin': p.depotBreakdown?.['dep-sin'] ?? 0,
    });
    setEditErrorMessage('');
    setEditSuccessMessage('');
  };

  // ── Save edited product ────────────────────────────────────────────────────
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditErrorMessage('');
    setEditSuccessMessage('');

    if (!editName.trim() || !editBrand.trim()) {
      setEditErrorMessage('Product Name and Brand are required.');
      return;
    }
    if (editPurchasePrice < 0 || editWholesalePrice < 0 || editSellingPrice < 0) {
      setEditErrorMessage('Pricing fields cannot be negative.');
      return;
    }

    setIsEditSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          brand: editBrand.trim(),
          model: editModel.trim(),
          categoryName: editCategoryName.trim(),
          description: editDescription.trim(),
          imageUrl: editImageUrl.trim(),
          purchasePrice: editPurchasePrice,
          wholesalePrice: editWholesalePrice,
          sellingPrice: editSellingPrice,
          taxRate: editTaxRate,
          minStockLevel: editMinStockLevel,
          trackSerial: editTrackSerial,
          depotBreakdown: editDepotBreakdown,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');

      setEditSuccessMessage(`${editName.trim()} updated successfully.`);
      await loadData();
      setTimeout(() => setEditingProduct(null), 800);
    } catch (err: any) {
      setEditErrorMessage(err.message || 'Failed to update product');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // ── Delete product ─────────────────────────────────────────────────────────
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      setDeletingProduct(null);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // Dynamic brand and category filters extracted from database products
  const availableBrands = ['ALL', ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))];
  const availableCategories = ['ALL', ...Array.from(new Set(products.map((p) => p.categoryName || 'General Optics').filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return false;
    if (selectedCategory !== 'ALL' && (p.categoryName || 'General Optics') !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const totalCatalogUnits = products.reduce((acc, p) => acc + (p.totalStock || 0), 0);
  const totalCatalogValuation = products.reduce((acc, p) => acc + (p.totalStock || 0) * (p.purchasePrice || 0), 0);

  // Live profit margin calculation for modal
  const calculatedMargin =
    sellingPrice > 0 ? (((sellingPrice - purchasePrice) / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Package className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Camera & Optics Equipment Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-brand-400 border border-slate-700">
              {products.length} Products in DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Database-driven product master with multi-depot stock distribution, wholesale margins, serial numbers & barcodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold shadow-sm transition-all active:scale-98"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Import Products (Excel/CSV)</span>
          </button>

          {/* Create Individual Product Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Catalog SKUs</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {products.length}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Live in database</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Physical Units</div>
          <div className="text-2xl font-bold font-mono text-brand-400 mt-1">
            {totalCatalogUnits.toLocaleString()}
          </div>
          <span className="text-[10px] text-brand-500/80 font-mono">Across all 4 depots</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Asset Valuation</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatUSD(totalCatalogValuation)}
          </div>
          <span className="text-[10px] text-emerald-500/80 font-mono">Purchase cost basis</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Low Stock Alerts</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {products.filter((p) => (p.totalStock || 0) <= (p.minStockLevel || 10)).length}
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono">At or below threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU (EOS-R5), Brand, Barcode..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:border-brand-500 focus:outline-none font-mono"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Brand tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {availableBrands.slice(0, 7).map((brandItem) => (
              <button
                key={brandItem}
                onClick={() => setSelectedBrand(brandItem)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedBrand === brandItem
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {brandItem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-3">
          <RefreshCw className="h-6 w-6 text-brand-400 animate-spin mx-auto" />
          <div className="text-slate-300 text-sm font-semibold">Loading products from database...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Products Found in Database</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery || selectedBrand !== 'ALL' || selectedCategory !== 'ALL'
                ? 'No catalog items match your current filter parameters.'
                : 'Get started by creating your first individual product or importing an existing catalog using Excel/CSV.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import Excel / CSV</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
            >
              <Plus className="h-4 w-4" />
              <span>Create Product</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const margin =
              p.sellingPrice > 0
                ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0)
                : '0';
            const isLowStock = (p.totalStock || 0) <= (p.minStockLevel || 10);

            return (
              <div
                key={p.id}
                className="glass-panel-interactive p-5 rounded-2xl border border-slate-800 flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Header Badges */}
                  <div className="relative h-48 rounded-xl overflow-hidden mb-3.5 bg-slate-950 border border-slate-800">
                    <img
                      src={cloudinaryThumb(p.imageUrl, 400) || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400';
                      }}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/90 backdrop-blur-md text-[10px] font-bold text-white border border-slate-700 shadow-sm">
                        {p.brand}
                      </span>
                      {p.trackSerial && (
                        <span className="px-2 py-0.5 rounded-lg bg-brand-600/90 text-[10px] font-bold text-white shadow-glow">
                          Serial Tracked
                        </span>
                      )}
                    </div>

                    {/* Edit / Delete action buttons */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                        className="p-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
                        title="Edit product"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingProduct(p); }}
                        className="p-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono shadow-sm ${
                          isLowStock
                            ? 'bg-rose-600/90 text-white shadow-glow'
                            : 'bg-emerald-600/90 text-white'
                        }`}
                      >
                        {p.totalStock ?? 0} in stock
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-brand-400">{p.sku}</span>
                    {p.barcode && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Barcode className="h-3 w-3 text-slate-500" />
                        <span>{p.barcode}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                    {p.name}
                  </h3>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Category: {p.categoryName || 'General Optics'}
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Multi-Depot Breakdown Matrix */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 font-mono mb-1.5">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        <span>Depot Distribution</span>
                      </div>
                      <span className="text-slate-500">{p.totalStock ?? 0} total</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                      <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-[9px]">BLR</div>
                        <div className="font-bold text-white mt-0.5">
                          {p.depotBreakdown?.['dep-blr'] ?? 0}
                        </div>
                      </div>
                      <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-[9px]">DXB</div>
                        <div className="font-bold text-white mt-0.5">
                          {p.depotBreakdown?.['dep-dxb'] ?? 0}
                        </div>
                      </div>
                      <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-[9px]">BOM</div>
                        <div className="font-bold text-white mt-0.5">
                          {p.depotBreakdown?.['dep-bom'] ?? 0}
                        </div>
                      </div>
                      <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-[9px]">SIN</div>
                        <div className="font-bold text-white mt-0.5">
                          {p.depotBreakdown?.['dep-sin'] ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Margins Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono">Wholesale Price</div>
                      <div className="text-sm font-bold text-white font-mono">
                        {formatUSD(p.wholesalePrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-400 font-mono font-semibold">
                        +{margin}% Margin
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        MSRP {formatUSD(p.sellingPrice)}
                      </div>
                    </div>
                  </div>
                  {/* Always-visible Edit + Delete buttons at card bottom */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-brand-600 hover:border-brand-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingProduct(p)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-rose-600/80 hover:border-rose-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESPONSIVE & SPACIOUS CREATE NEW PRODUCT MODAL                            */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl h-full max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Fixed Modal Header */}
            <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Catalog Product</h3>
                  <p className="text-xs text-slate-400">
                    Register hardware in database with multi-depot inventory and serial tracking.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form id="create-product-form" onSubmit={handleCreateProduct} className="flex flex-col gap-4 text-xs">
                {/* SECTION 1: Basic & Brand Information */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <Package className="h-4 w-4 text-brand-400" />
                    <span>1. Core Hardware Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Product Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. Sony FX3 Full-Frame Cinema Line Camera"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        SKU / Part Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. SONY-FX3"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Brand / Manufacturer <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Canon">Canon</option>
                        <option value="Sony">Sony</option>
                        <option value="Nikon">Nikon</option>
                        <option value="RED">RED Digital Cinema</option>
                        <option value="ARRI">ARRI</option>
                        <option value="DJI">DJI</option>
                        <option value="Blackmagic">Blackmagic Design</option>
                        <option value="Aputure">Aputure</option>
                        <option value="SanDisk">SanDisk</option>
                        <option value="Sennheiser">Sennheiser</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Model / Series</label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. ILME-FX3"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Category</label>
                      <input
                        type="text"
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. Camera Bodies, Cinema Lenses..."
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Pricing, Margins & Taxation */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>2. Pricing & Margin Structure</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span>Calculated Margin:</span>
                      <strong>+{calculatedMargin}%</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Purchase Cost ($)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={0.01}
                        value={purchasePrice || ''}
                        onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Wholesale Price ($)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={0.01}
                        value={wholesalePrice || ''}
                        onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">MSRP / Selling ($)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={0.01}
                        value={sellingPrice || ''}
                        onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Tax Rate (%)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        max={100}
                        step={0.1}
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Initial Depot Inventory Distribution */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span>3. Initial Depot Stock & Serial Tracking</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={trackSerial}
                        onChange={(e) => setTrackSerial(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-0"
                      />
                      <span className="font-semibold text-xs">Auto-Generate & Track Serials</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <label className="block text-[11px] text-slate-400 font-mono">Bangalore (BLR)</label>
                      <input
                        type="number"
                        min={0}
                        value={depotBreakdown['dep-blr']}
                        onChange={(e) =>
                          setDepotBreakdown({
                            ...depotBreakdown,
                            'dep-blr': Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <label className="block text-[11px] text-slate-400 font-mono">Dubai (DXB)</label>
                      <input
                        type="number"
                        min={0}
                        value={depotBreakdown['dep-dxb']}
                        onChange={(e) =>
                          setDepotBreakdown({
                            ...depotBreakdown,
                            'dep-dxb': Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <label className="block text-[11px] text-slate-400 font-mono">Mumbai (BOM)</label>
                      <input
                        type="number"
                        min={0}
                        value={depotBreakdown['dep-bom']}
                        onChange={(e) =>
                          setDepotBreakdown({
                            ...depotBreakdown,
                            'dep-bom': Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <label className="block text-[11px] text-slate-400 font-mono">Singapore (SIN)</label>
                      <input
                        type="number"
                        min={0}
                        value={depotBreakdown['dep-sin']}
                        onChange={(e) =>
                          setDepotBreakdown({
                            ...depotBreakdown,
                            'dep-sin': Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Barcode / EAN-13</label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="Leave blank to auto-generate"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Minimum Stock Reorder Threshold</label>
                      <input
                        type="number"
                        min={1}
                        value={minStockLevel}
                        onChange={(e) => setMinStockLevel(Math.max(1, parseInt(e.target.value) || 10))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Media & Description */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    <span>4. Product Media & Specifications</span>
                  </div>

                  <div className="space-y-3">
                    <ImageUploadField
                      value={imageUrl}
                      onChange={(url) => setImageUrl(url)}
                      label="Product Hardware Image"
                      placeholder="Paste image URL or browse local photo"
                    />

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Technical Description / Notes</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. 10.2MP Full-Frame Back-Illuminated Exmor R CMOS Sensor, 4K 120p, S-Cinetone color profile..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-product-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Product to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Product Import Modal */}
      {isImportModalOpen && (
        <BulkProductImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* ====================================================================== */}
      {/* EDIT PRODUCT MODAL                                                      */}
      {/* ====================================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl h-full max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Product</h3>
                  <p className="text-xs text-slate-400 font-mono">{editingProduct.sku} — {editingProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
              {editErrorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{editErrorMessage}</span>
                </div>
              )}
              {editSuccessMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{editSuccessMessage}</span>
                </div>
              )}

              <form id="edit-product-form" onSubmit={handleEditProduct} className="flex flex-col gap-4 text-xs">
                {/* SECTION 1: Core Details */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <Package className="h-4 w-4 text-brand-400" />
                    <span>1. Core Hardware Details</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-500 normal-case">SKU: {editingProduct.sku} (immutable)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-slate-300 font-medium">Product Name <span className="text-rose-400">*</span></label>
                      <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Brand <span className="text-rose-400">*</span></label>
                      <input type="text" required value={editBrand} onChange={(e) => setEditBrand(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Model / Series</label>
                      <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Category</label>
                      <input type="text" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Pricing */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>2. Pricing & Margin Structure</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span>Margin:</span>
                      <strong>+{editSellingPrice > 0 ? (((editSellingPrice - editPurchasePrice) / editSellingPrice) * 100).toFixed(1) : '0'}%</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Purchase Cost ($)</label>
                      <input type="number" min={0} step={0.01} value={editPurchasePrice || ''}
                        onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Wholesale Price ($)</label>
                      <input type="number" min={0} step={0.01} value={editWholesalePrice || ''}
                        onChange={(e) => setEditWholesalePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">MSRP / Selling ($)</label>
                      <input type="number" min={0} step={0.01} value={editSellingPrice || ''}
                        onChange={(e) => setEditSellingPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Tax Rate (%)</label>
                      <input type="number" min={0} max={100} step={0.1} value={editTaxRate}
                        onChange={(e) => setEditTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Depot Stock */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span>3. Depot Stock Levels</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input type="checkbox" checked={editTrackSerial} onChange={(e) => setEditTrackSerial(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-0" />
                      <span className="font-semibold text-xs">Serial Tracked</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{ id: 'dep-blr', label: 'Bangalore (BLR)' }, { id: 'dep-dxb', label: 'Dubai (DXB)' }, { id: 'dep-bom', label: 'Mumbai (BOM)' }, { id: 'dep-sin', label: 'Singapore (SIN)' }].map(({ id, label }) => (
                      <div key={id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <label className="block text-[11px] text-slate-400 font-mono">{label}</label>
                        <input type="number" min={0} value={editDepotBreakdown[id]}
                          onChange={(e) => setEditDepotBreakdown({ ...editDepotBreakdown, [id]: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-medium">Minimum Stock Reorder Threshold</label>
                    <input type="number" min={1} value={editMinStockLevel}
                      onChange={(e) => setEditMinStockLevel(Math.max(1, parseInt(e.target.value) || 10))}
                      className="w-full sm:w-48 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none" />
                  </div>
                </div>

                {/* SECTION 4: Media */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    <span>4. Product Media & Specifications</span>
                  </div>
                  <div className="space-y-3">
                    <ImageUploadField
                      value={editImageUrl}
                      onChange={(url) => setEditImageUrl(url)}
                      label="Product Hardware Image"
                      placeholder="Paste image URL or browse local photo"
                    />
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Technical Description / Notes</label>
                      <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
              <button type="button" onClick={() => setEditingProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                Cancel
              </button>
              <button type="submit" form="edit-product-form" disabled={isEditSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50">
                {isEditSubmitting ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /><span>Saving...</span></>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /><span>Save Changes</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* DELETE CONFIRM MODAL                                                    */}
      {/* ====================================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Product?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="font-mono text-xs text-brand-400 font-bold">{deletingProduct.sku}</div>
              <div className="text-sm font-semibold text-white mt-0.5 line-clamp-2">{deletingProduct.name}</div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                {deletingProduct.totalStock ?? 0} units across all depots will be removed.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setDeletingProduct(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteProduct} disabled={isDeleteSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50">
                {isDeleteSubmitting ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /><span>Deleting...</span></>
                ) : (
                  <><Trash2 className="h-4 w-4" /><span>Yes, Delete Product</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
