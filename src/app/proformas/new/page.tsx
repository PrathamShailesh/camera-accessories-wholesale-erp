'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck2,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  DollarSign,
  Package,
  CheckCircle2,
  Search,
  ChevronRight,
  UserPlus,
  X,
  Users,
  Send,
  Check,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { Customer, Product, Depot, PaymentTerms } from '@/types/erp';
import { Button, LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

const STEPS = [
  { step: 1, name: 'Customer', desc: 'Select or add client' },
  { step: 2, name: 'Products', desc: 'Add equipment & stock' },
  { step: 3, name: 'Pricing', desc: 'Line prices & discounts' },
  { step: 4, name: 'Depot / Fulfilment', desc: 'Assign warehouse hub' },
  { step: 5, name: 'Review', desc: 'Verify totals & terms' },
  { step: 6, name: 'Create & Send', desc: 'Issue quotation' },
];

function ProformaBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCustomerId = searchParams.get('customerId');

  const [currentStep, setCurrentStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Customer search & modal
  const [customerSearch, setCustomerSearch] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustContact, setNewCustContact] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCountry, setNewCustCountry] = useState('United Arab Emirates');

  // Product Live Search for Step 2
  const [productQuery, setProductQuery] = useState('');

  // Form line items
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
      console.error('Error loading proforma data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter((p) => {
    if (!productQuery.trim()) return true;
    const q = productQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q))
    );
  });

  const addProductToItems = (p: Product) => {
    const existingIndex = items.findIndex((i) => i.productId === p.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: p.id,
          quantity: 1,
          unitPrice: p.sellingPrice,
          discountPercent: 0,
          selectedDepotId: depots[0]?.id || 'dep-dxb',
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
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
          billingAddress: `${newCustCompany}, ${newCustCountry}`,
          shippingAddress: `${newCustCompany}, ${newCustCountry}`,
          taxNumber: 'TAX-PENDING',
          paymentTerms: 'NET_30',
          creditLimit: 50000,
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
      setCurrentStep(1);
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item');
      setCurrentStep(2);
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Top Page Header */}
      <PageHeader
        eyebrow="02 / SALES"
        breadcrumbs={[{ label: 'Proformas', href: '/proformas' }, { label: 'New' }]}
        title="Create Proforma"
        description="Multi-step wholesale quotation builder — from customer to send."
        actions={
          <>
            <LinkButton href="/proformas" variant="outline" size="sm">
              Cancel
            </LinkButton>
            {currentStep < 6 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                Continue to Step {currentStep + 1} →
              </Button>
            ) : (
              <Button
                size="sm"
                loading={isSubmitting}
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                Issue & Send Proforma
              </Button>
            )}
          </>
        }
      />

      {errorMessage && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress Stepper Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center gap-2.5 p-2 rounded-md border text-left transition-colors ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 font-semibold'
                    : isCompleted
                      ? 'border-slate-200 bg-slate-50 text-slate-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-none truncate">{s.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate hidden sm:block">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: CUSTOMER SELECTION */}
      {currentStep === 1 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Step 1: Select Wholesale Customer</h2>
              <p className="text-xs text-slate-500 mt-0.5">Choose an active client profile or register a new customer account</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<UserPlus className="h-3.5 w-3.5 text-indigo-600" />}
              onClick={() => setIsQuickAddOpen(true)}
            >
              + Quick Add Customer
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by company name, contact person, customer code, email, or country..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomerId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1">{c.companyName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.contactPerson}</div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {c.customerCode}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-0.5">
                    <div>Email: <span className="text-slate-700">{c.email}</span></div>
                    <div>Country: <span className="text-slate-700">{c.country}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedCustomerId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Continue to Product Selection →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: PRODUCT SELECTION */}
      {currentStep === 2 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Step 2: Equipment & Product Selection</h2>
            <p className="text-xs text-slate-500 mt-0.5">Search catalog for Sony, Canon, DJI cameras, lenses, and cine accessories</p>
          </div>

          {/* Product Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Quick search Sony, Canon, DJI, SKU, lens category..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white"
            />
          </div>

          {/* Catalog grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inItems = items.some((i) => i.productId === p.id);
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                    inItems ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="h-12 w-12 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{p.sku}</div>
                    <div className="text-xs font-semibold text-slate-900 mt-0.5">{formatUSD(p.sellingPrice)}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={inItems ? 'secondary' : 'outline'}
                    onClick={() => addProductToItems(p)}
                    className="shrink-0 text-xs"
                  >
                    {inItems ? '+ Add Qty' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Selected Items Table */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Selected Order Items ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 text-xs">
                    <div className="h-9 w-9 rounded bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                      {prod?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{prod?.name || 'Select equipment'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{prod?.sku}</div>
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-slate-400 block">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].quantity = Math.max(1, Number(e.target.value));
                          setItems(updated);
                        }}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div className="w-28 text-right font-mono font-semibold text-slate-900">
                      {formatUSD(item.quantity * item.unitPrice)}
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => handleRemoveItem(idx)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              ← Back to Customer
            </Button>
            <Button onClick={() => setCurrentStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
              Continue to Pricing & Discounts →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PRICING & DISCOUNTS */}
      {currentStep === 3 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Step 3: Line Item Pricing & Overall Discounts</h2>
            <p className="text-xs text-slate-500 mt-0.5">Adjust unit pricing, volume discounts, freight charges, and tax rates</p>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              return (
                <div key={idx} className="p-3.5 rounded-md border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                  <div className="sm:col-span-5 font-semibold text-slate-900">
                    {prod?.name} <span className="font-mono text-slate-500 text-[11px]">({prod?.sku})</span>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 block">Unit Selling Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].unitPrice = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block">Line Discount %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPercent}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].discountPercent = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 text-right font-mono font-bold text-slate-900">
                    {formatUSD(item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Overall Deal Discount (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Shipping / Freight ($)</label>
              <input
                type="number"
                min={0}
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              ← Back to Products
            </Button>
            <Button onClick={() => setCurrentStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
              Continue to Depot Assignment →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: DEPOT / FULFILMENT ASSIGNMENT */}
      {currentStep === 4 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Step 4: Depot & Fulfilment Hub Assignment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Assign primary depot location for picking and physical shipping</p>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              return (
                <div key={idx} className="p-3.5 rounded-md border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{prod?.name}</div>
                    <div className="text-[11px] text-slate-500">Requested quantity: {item.quantity} units</div>
                  </div>
                  <div className="w-full sm:w-64">
                    <label className="text-[10px] text-slate-400 block mb-1">Dispatch Depot</label>
                    <select
                      value={item.selectedDepotId}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].selectedDepotId = e.target.value;
                        setItems(updated);
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                    >
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              ← Back to Pricing
            </Button>
            <Button onClick={() => setCurrentStep(5)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
              Continue to Financial Review →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW */}
      {currentStep === 5 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Step 5: Review Financial Quotation Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">Verify customer profile, line item breakdown, and total values before creation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border border-slate-200 rounded-md p-4 bg-slate-50/50">
            <div>
              <span className="text-slate-400 block">Customer Account</span>
              <span className="font-bold text-slate-900">{selectedCustomer?.companyName}</span>
              <div className="text-slate-500">{selectedCustomer?.contactPerson} • {selectedCustomer?.email}</div>
            </div>
            <div>
              <span className="text-slate-400 block">Payment & Delivery Terms</span>
              <span className="font-semibold text-slate-900">{paymentTerms}</span>
              <div className="text-slate-500">{deliveryTerms}</div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md p-4 bg-white space-y-3 font-mono text-xs max-w-md ml-auto">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">{formatUSD(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Overall Discount ({discountPercent}%):</span>
              <span className="text-rose-600">-{formatUSD(overallDiscountAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT / Tax (5%):</span>
              <span className="text-slate-900">{formatUSD(totalTax)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Freight / Shipping:</span>
              <span className="text-slate-900">{formatUSD(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
              <span>Grand Total (USD):</span>
              <span className="text-indigo-600">{formatUSD(grandTotal)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(4)}>
              ← Back to Depot Assignment
            </Button>
            <Button onClick={() => setCurrentStep(6)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
              Proceed to Create & Send →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: CREATE & SEND */}
      {currentStep === 6 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-xs text-center space-y-4 max-w-xl mx-auto">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Ready to Issue Proforma Quotation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Clicking below will save the proforma in the database and generate official document records.
            </p>
          </div>

          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-left space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Client:</span>
              <span className="font-semibold text-slate-900">{selectedCustomer?.companyName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Items:</span>
              <span className="font-mono text-slate-900">{items.length} line items</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Grand Total:</span>
              <span className="font-mono font-bold text-indigo-600">{formatUSD(grandTotal)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setCurrentStep(5)}>
              ← Back to Review
            </Button>
            <Button
              loading={isSubmitting}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2"
            >
              Issue & Create Proforma Now
            </Button>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Quick Add Wholesale Customer</h3>
              </div>
              <button onClick={() => setIsQuickAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="flex flex-col gap-3 text-xs text-slate-700">
              <Input
                label="Company Legal Name *"
                required
                placeholder="e.g. Apex Media Middle East"
                value={newCustCompany}
                onChange={(e) => setNewCustCompany(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Contact Person *"
                  required
                  placeholder="e.g. Tariq Al-Sayed"
                  value={newCustContact}
                  onChange={(e) => setNewCustContact(e.target.value)}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  required
                  placeholder="tariq@apexmedia.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  placeholder="+971 4 881 2299"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
                <Input
                  label="Country"
                  value={newCustCountry}
                  onChange={(e) => setNewCustCountry(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsQuickAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save & Select Customer</Button>
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
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Proforma Wizard...</div>}>
      <ProformaBuilder />
    </Suspense>
  );
}
