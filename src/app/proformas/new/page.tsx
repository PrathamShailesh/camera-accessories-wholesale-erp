'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileCheck2,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  DollarSign,
  Package,
  CheckCircle,
  Sparkles,
  Search,
  ChevronDown,
  UserPlus,
  X,
  Users,
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { Customer, Product, Depot, PaymentTerms } from '@/types/erp';

function ProformaBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Customer search combobox state
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Add Customer modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustContact, setNewCustContact] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCountry, setNewCustCountry] = useState('United Arab Emirates');
  const [newCustBilling, setNewCustBilling] = useState('');
  const [newCustShipping, setNewCustShipping] = useState('');
  const [newCustTaxId, setNewCustTaxId] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(100000);
  const [newCustTerms, setNewCustTerms] = useState<PaymentTerms>('NET_30');

  const [items, setItems] = useState<
    {
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      selectedDepotId: string;
    }[]
  >([]);

  const [shippingCost, setShippingCost] = useState<number>(150);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('NET 30 days from dispatch');
  const [deliveryTerms, setDeliveryTerms] = useState<string>('Air Freight via Courier (CIF)');
  const [notes, setNotes] = useState<string>('Official wholesale quotation. Subject to equipment availability.');
  const [expiryDays, setExpiryDays] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      const [custsRes, prodsRes, depsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/depots'),
      ]);
      const custs = custsRes.ok ? await custsRes.json() : [];
      const prods = prodsRes.ok ? await prodsRes.json() : [];
      const deps = depsRes.ok ? await depsRes.json() : [];
      setCustomers(custs);
      setProducts(prods);
      setDepots(deps);

      if (!selectedCustomerId) {
        if (queryCustomerId && custs.some((c: any) => c.id === queryCustomerId)) {
          setSelectedCustomerId(queryCustomerId);
        } else if (custs.length > 0) {
          setSelectedCustomerId(custs[0].id);
        }
      }

      if (items.length === 0 && prods.length > 0) {
        setItems([
          {
            productId: prods[0].id,
            quantity: 1,
            unitPrice: prods[0].sellingPrice,
            discountPercent: 0,
            selectedDepotId: deps[0]?.id || 'dep-dxb',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryCustomerId]);

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleAddItem = () => {
    if (products.length === 0) {
      setErrorMessage('No products available in catalog. Please add products first.');
      return;
    }
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd.id,
        quantity: 1,
        unitPrice: firstProd.sellingPrice,
        discountPercent: 0,
        selectedDepotId: depots[0]?.id || 'dep-dxb',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const p = products.find((prod) => prod.id === prodId);
    if (!p) return;
    const updated = [...items];
    updated[index].productId = prodId;
    updated[index].unitPrice = p.sellingPrice;
    setItems(updated);
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustCompany || !newCustContact || !newCustEmail) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newCustCompany,
          contactPerson: newCustContact,
          email: newCustEmail,
          phone: newCustPhone,
          country: newCustCountry,
          billingAddress: newCustBilling || `${newCustCompany}, ${newCustCountry}`,
          shippingAddress: newCustShipping || newCustBilling || `${newCustCompany}, ${newCustCountry}`,
          taxNumber: newCustTaxId || 'TAX-PENDING',
          paymentTerms: newCustTerms,
          creditLimit: Number(newCustCredit) || 50000,
        }),
      });

      if (!res.ok) {
        setErrorMessage('Failed to create customer');
        return;
      }

      const created = await res.json();

      const custsRes = await fetch('/api/customers');
      const updatedCusts = custsRes.ok ? await custsRes.json() : [];
      setCustomers(updatedCusts);
      setSelectedCustomerId(created.id);
      setIsQuickAddOpen(false);
      setErrorMessage('');

      setNewCustCompany('');
      setNewCustContact('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustBilling('');
      setNewCustShipping('');
      setNewCustTaxId('');
    } catch {
      setErrorMessage('Failed to create customer');
    }
  };

  // Financial Calculations
  let subtotal = 0;
  let totalTax = 0;

  items.forEach((item) => {
    if (!item.productId) return;
    const p = products.find((prod) => prod.id === item.productId);
    if (!p) return;
    const itemSub = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    const taxRate = p ? p.taxRate : 5;
    const itemTax = itemSub * (taxRate / 100);
    subtotal += item.quantity * item.unitPrice;
    totalTax += itemTax;
  });

  const overallDiscountAmt = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - overallDiscountAmt + totalTax + Number(shippingCost || 0);

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      setErrorMessage('Please select a wholesale customer');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/proformas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items,
          discountPercent,
          shippingCost: Number(shippingCost),
          paymentTerms,
          deliveryTerms,
          notes,
          expiryDays,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create proforma');
      }

      const newPf = await res.json();
      router.push(`/proformas/${newPf.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create proforma');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/proformas"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Create Proforma Invoice</h1>
            <p className="text-xs text-slate-400">
              Draft official wholesale quotation with dynamic multi-depot stock check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/proformas"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <FileCheck2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Creating Proforma...' : 'Create Proforma Quotation'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Customer Selection & Searchable Combobox */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative z-30">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            1. Wholesale Customer Selection
          </h2>
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Quick Add New Customer</span>
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">No Wholesale Customers Registered</div>
                <div className="text-[11px] text-amber-300">You must register at least one client account before drafting quotes.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 shadow-sm"
            >
              + Quick Add Customer Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Searchable Customer Combobox */}
            <div className="relative z-40" ref={customerDropdownRef}>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Search & Select Customer
              </label>

              {/* Selected Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-left text-white hover:border-brand-500/60 focus:outline-none"
              >
                <div className="truncate">
                  {selectedCustomer ? (
                    <span>
                      <strong className="text-white">{selectedCustomer.companyName}</strong>{' '}
                      <span className="text-slate-400">({selectedCustomer.customerCode})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Choose wholesale customer...</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
              </button>

              {/* Search Dropdown Popover */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-2 animate-fade-in">
                  {/* Search input */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Type name, company, code..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-52 overflow-y-auto space-y-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No customer matching &quot;{customerSearch}&quot;
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearch('');
                          }}
                          className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                            selectedCustomerId === c.id
                              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-white line-clamp-1">{c.companyName}</div>
                            <div className="text-[10px] text-slate-400">
                              {c.contactPerson} • {c.country}
                            </div>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-brand-400 px-1.5 py-0.5 rounded bg-slate-800">
                            {c.customerCode}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Billing Address
              </label>
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-300 min-h-[42px] line-clamp-2">
                {selectedCustomer?.billingAddress || '—'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Shipping / Receiving Hub
              </label>
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-300 min-h-[42px] line-clamp-2">
                {selectedCustomer?.shippingAddress || '—'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Line Items & Depot Stock Availability */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            2. Line Items & Multi-Depot Stock Selection
          </h2>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={products.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-300 border border-brand-500/30 text-xs font-semibold hover:bg-brand-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {products.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Package className="h-10 w-10 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white">Product Catalog is Empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No cameras, cinema lenses, or accessories have been registered yet. Add products to the catalog first.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
            >
              <Plus className="h-4 w-4" />
              <span>Go to Product Catalog & Add Hardware</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
          {items.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            
            // Calculate real live stock for the selected depot
            const selectedDepotQty =
              product?.depotBreakdown && typeof product.depotBreakdown[item.selectedDepotId] === 'number'
                ? product.depotBreakdown[item.selectedDepotId]
                : (product?.totalStock || 0);

            // Find alternative depots that have stock available
            const alternativeDepots = depots
              .filter((d) => d.id !== item.selectedDepotId && (product?.depotBreakdown?.[d.id] || 0) > 0)
              .map((d) => ({
                depotId: d.id,
                depotName: d.name,
                availableQty: product?.depotBreakdown?.[d.id] || 0,
              }));

            const stockCheck = {
              available: selectedDepotQty >= item.quantity,
              availableAtDepot: selectedDepotQty,
              alternativeDepots,
            };

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Product selector */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] text-slate-400 mb-1">Equipment / Model</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - {formatUSD(p.sellingPrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Depot selector */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-slate-400 mb-1">Fulfilment Depot</label>
                    <select
                      value={item.selectedDepotId}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].selectedDepotId = e.target.value;
                        setItems(updated);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                    >
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name.replace(' Central Depot', '').replace(' Logistics Hub', '')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].quantity = Math.max(1, Number(e.target.value));
                        setItems(updated);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* Unit Price (USD) */}
                  <div className="md:col-span-2 relative">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] text-slate-400 mb-1">Unit Price ($)</label>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-400 hover:text-rose-300 mb-1 p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].unitPrice = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Stock Availability Checker Banner */}
                <div
                  className={`p-2.5 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    stockCheck.available
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {stockCheck.available ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    )}
                    <span>
                      <strong>Stock at selected depot:</strong> {stockCheck.availableAtDepot} units available (Requested: {item.quantity}).
                    </span>
                  </div>

                  {!stockCheck.available && stockCheck.alternativeDepots.length > 0 && (
                    <div className="text-[11px] text-amber-300 font-mono">
                      Available elsewhere: {stockCheck.alternativeDepots.map((alt) => `${alt.depotName.split(' ')[0]}: ${alt.availableQty}`).join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Commercial Terms & Pricing Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            3. Commercial Terms & Expiry
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Delivery / Dispatch Terms
              </label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Validity Window (Days)
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  disabled
                  value="USD ($)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Internal Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4">
              4. Pricing & Tax Breakdown
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({items.length} items):</span>
                <span className="text-white font-bold">{formatUSD(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Overall Discount (%):</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-slate-400">
                <span>VAT / Tax (Standard 5%):</span>
                <span className="text-white">{formatUSD(totalTax)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Freight / Shipping ($):</span>
                <input
                  type="number"
                  min={0}
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Grand Total (USD):</span>
                <span className="text-xl font-black text-brand-400">{formatUSD(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <Link
              href="/proformas"
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating Proforma...' : 'Create Proforma Quotation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Quick Add Wholesale Customer</h3>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="flex flex-col gap-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Media Middle East"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Al-Sayed"
                    value={newCustContact}
                    onChange={(e) => setNewCustContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="tariq@apexmedia.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+971 4 881 2299"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={newCustCountry}
                    onChange={(e) => setNewCustCountry(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Billing & Shipping Address</label>
                <textarea
                  rows={2}
                  placeholder="Studio City Tower, Office 1402, Dubai, UAE"
                  value={newCustBilling}
                  onChange={(e) => {
                    setNewCustBilling(e.target.value);
                    setNewCustShipping(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewProformaPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Proforma Builder...</div>}>
      <ProformaBuilder />
    </Suspense>
  );
}
