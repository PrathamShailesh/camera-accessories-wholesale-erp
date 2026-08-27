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
} from 'lucide-react';
import { formatUSD, formatDate } from '@/lib/utils';
import { Customer } from '@/types/erp';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United States');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET_30');
  const [creditLimit, setCreditLimit] = useState(50000);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactPerson,
          email,
          phone,
          country,
          billingAddress,
          shippingAddress,
          taxNumber,
          paymentTerms,
          creditLimit,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      setIsModalOpen(false);
      setErrorMessage('');
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
      setNotes('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create customer');
    }
  };

  const filtered = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Wholesale Customer Accounts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            B2B client directory, credit limits, VAT/GST registrations and transaction history in USD ($).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Company, Code, Email or Contact..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400 text-sm">Loading customers...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((c) => (
          <div
            key={c.id}
            className="glass-panel-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono text-[10px] font-bold">
                    {c.customerCode}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{c.companyName}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {c.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300 mt-3">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>{c.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{c.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{c.phone}</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500">Credit Limit</div>
                  <div className="font-bold text-white">{formatUSD(c.creditLimit)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Current Balance</div>
                  <div className="font-bold text-amber-400">{formatUSD(c.currentBalance)}</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-3 italic">
                {c.notes || 'Standard wholesale terms.'}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                {c.totalOrders || 0} Orders • {formatUSD(c.totalSpent)} Volume
              </span>
              <Link
                href={`/customers/${c.id}`}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <span>Customer 360 View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Create New Customer</h3>
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

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. ABC Camera Store"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. John Smith"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. john@abccamera.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. United States"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tax / VAT Number</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    placeholder="e.g. TAX-123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Billing Address *</label>
                <textarea
                  required
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  placeholder="e.g. 123 Main Street, New York, NY 10001"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Shipping Address *</label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  placeholder="e.g. 123 Main Street, New York, NY 10001"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="NET_15">NET 15 days</option>
                    <option value="NET_30">NET 30 days</option>
                    <option value="NET_45">NET 45 days</option>
                    <option value="NET_60">NET 60 days</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit (USD) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  placeholder="e.g. Premium client, prefers express shipping"
                />
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
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
