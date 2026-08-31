'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Building2,
  DollarSign,
  ArrowRight,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  MapPin,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatUSD, formatDate } from '@/lib/utils';
import { Customer, PaymentTerms } from '@/types/erp';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields (used for both create & edit)
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United States');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('NET_30');
  const [creditLimit, setCreditLimit] = useState<number>(50000);
  const [status, setStatus] = useState<'ACTIVE' | 'ON_HOLD' | 'INACTIVE'>('ACTIVE');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setError(null);
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setCountry('United States');
    setBillingAddress('');
    setShippingAddress('');
    setTaxNumber('');
    setPaymentTerms('NET_30');
    setCreditLimit(50000);
    setStatus('ACTIVE');
    setNotes('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setCompanyName(customer.companyName || '');
    setContactPerson(customer.contactPerson || '');
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setCountry(customer.country || 'United States');
    setBillingAddress(customer.billingAddress || '');
    setShippingAddress(customer.shippingAddress || '');
    setTaxNumber(customer.taxNumber || '');
    setPaymentTerms(customer.paymentTerms || 'NET_30');
    setCreditLimit(customer.creditLimit || 50000);
    setStatus((customer.status as any) || 'ACTIVE');
    setNotes(customer.notes || '');
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!companyName.trim() || !contactPerson.trim() || !email.trim()) {
      setErrorMessage('Company Name, Contact Person, and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
          billingAddress: billingAddress.trim() || `${companyName}, ${country}`,
          shippingAddress: shippingAddress.trim() || billingAddress.trim() || `${companyName}, ${country}`,
          taxNumber: taxNumber.trim() || 'TAX-PENDING',
          paymentTerms,
          creditLimit: Number(creditLimit),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }

      setSuccessMessage('Customer created successfully in database.');
      await loadData();

      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setErrorMessage('');
    setSuccessMessage('');

    if (!companyName.trim() || !contactPerson.trim() || !email.trim()) {
      setErrorMessage('Company Name, Contact Person, and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
          billingAddress: billingAddress.trim(),
          shippingAddress: shippingAddress.trim(),
          taxNumber: taxNumber.trim(),
          paymentTerms,
          creditLimit: Number(creditLimit),
          status,
          notes: notes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      setSuccessMessage(`Changes saved for ${companyName}.`);
      await loadData();

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        resetForm();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Wholesale Customer Accounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-brand-400 border border-slate-700">
              {customers.length} Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            B2B client directory, credit limits, VAT/GST registrations, payment terms & account management.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Company, Code, Email, Country or Contact..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customers Cards */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-3">
          <RefreshCw className="h-6 w-6 text-brand-400 animate-spin mx-auto" />
          <div className="text-slate-300 text-sm font-semibold">Loading customer directory...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Customer Accounts Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'No client accounts match your search query.'
                : 'Create your first B2B wholesale client profile to begin issuing proformas and tax invoices.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Customer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="glass-panel-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between group"
            >
              <div>
                {/* Header with Code, Name, Status, and Edit Button */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono text-[10px] font-bold">
                      {c.customerCode}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-brand-300 transition-colors">
                      {c.companyName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : c.status === 'ON_HOLD'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-400 border-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>

                    {/* Edit Customer Action Button */}
                    <button
                      onClick={() => handleOpenEdit(c)}
                      title={`Edit ${c.companyName}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mt-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-semibold text-white">{c.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-slate-300">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-slate-400">{c.phone || '—'}</span>
                  </div>
                  {c.country && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-slate-400">{c.country}</span>
                    </div>
                  )}
                </div>

                {/* Financial & Terms Tile */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500">Credit Limit</div>
                    <div className="font-bold text-white mt-0.5">{formatUSD(c.creditLimit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Current Balance</div>
                    <div className="font-bold text-amber-400 mt-0.5">{formatUSD(c.currentBalance)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Terms</div>
                    <div className="font-bold text-slate-300 mt-0.5">{c.paymentTerms?.replace('_', ' ')}</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 italic line-clamp-1">
                  {c.notes || 'Standard wholesale terms.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {c.totalOrders || 0} Orders • {formatUSD(c.totalSpent || 0)} Volume
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
                  >
                    Edit Profile
                  </button>
                  <Link
                    href={`/customers/${c.id}`}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                  >
                    <span>Customer 360</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE CUSTOMER MODAL                                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl h-full max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Customer Account</h3>
                  <p className="text-xs text-slate-400">
                    Register a new B2B wholesaler, production house or rental agency in database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
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

              <form id="create-customer-form" onSubmit={handleCreateCustomer} className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    1. Company & Primary Contact
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Company Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. Apex Broadcast & Cinema Solutions LLC"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Primary Contact Person <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. Alex Morgan"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Work Email <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. purchasing@apexbroadcast.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. +971 4 390 1200"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    2. Location & Tax Registration
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Country / Region</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. United Arab Emirates, India, Singapore, USA"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Tax / VAT / GST Number</label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. TRN-10029384910003"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Billing Address</label>
                      <textarea
                        rows={2}
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="Registered commercial billing address..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Shipping Address</label>
                      <textarea
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="Warehouse or studio delivery address..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    3. Commercial Terms & Credit
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Payment Terms</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      >
                        <option value="NET_15">NET 15 Days</option>
                        <option value="NET_30">NET 30 Days</option>
                        <option value="NET_60">NET 60 Days</option>
                        <option value="IMMEDIATE">Immediate / Wire Transfer</option>
                        <option value="ADVANCE_50">50% Advance, 50% on Dispatch</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Credit Limit ($ USD)</label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-slate-300 font-medium">Internal Notes & Commercial Profile</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. VIP Cine Rental House, preferential pricing tier 1..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-customer-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Create Customer Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CUSTOMER MODAL                                                       */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl h-full max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Edit Customer: {editingCustomer.companyName}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-brand-400 border border-slate-700">
                      {editingCustomer.customerCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update commercial terms, billing addresses, credit limits, and contact information.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
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

              <form id="edit-customer-form" onSubmit={handleUpdateCustomer} className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      1. Company Profile & Status
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-slate-400 font-medium">Account Status:</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ON_HOLD">ON HOLD</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Company Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Primary Contact Person <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">
                        Work Email <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    2. Location & Tax Registration
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Country / Region</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Tax / VAT / GST Number</label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Billing Address</label>
                      <textarea
                        rows={2}
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Shipping Address</label>
                      <textarea
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    3. Commercial Terms & Credit
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Payment Terms</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      >
                        <option value="NET_15">NET 15 Days</option>
                        <option value="NET_30">NET 30 Days</option>
                        <option value="NET_60">NET 60 Days</option>
                        <option value="IMMEDIATE">Immediate / Wire Transfer</option>
                        <option value="ADVANCE_50">50% Advance, 50% on Dispatch</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-300 font-medium">Credit Limit ($ USD)</label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-slate-300 font-medium">Internal Notes & Remarks</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-customer-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Updates...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Update Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
