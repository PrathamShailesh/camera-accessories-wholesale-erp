'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Printer,
  Sparkles,
  Receipt,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Plus,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Proforma } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';

export default function ProformasPage() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Proforma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proformas');
      if (res.ok) {
        const data = await res.json();
        setProformas(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load proformas');
        setProformas(dataStore.getProformas());
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setProformas(dataStore.getProformas());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // SSE listener for instant updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'PROFORMA_UPDATED' || payload.type === 'PROFORMA_CONFIRMED') {
            loadData();
          }
        } catch {}
      };
    } catch {}

    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filteredProformas = proformas.filter((pf) => {
    if (filterStatus !== 'ALL' && pf.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        pf.proformaNumber.toLowerCase().includes(q) ||
        pf.customerCompany.toLowerCase().includes(q) ||
        pf.customerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalProformaValue = filteredProformas.reduce((sum, pf) => sum + pf.grandTotal, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-400 text-sm">Loading proformas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Proforma Invoices & Quotations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, send and convert wholesale quotes into Tax Invoices in 1-click. All values in USD ($).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/proformas/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Proforma</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Proforma # or Customer..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'DRAFT', 'SENT', 'CONFIRMED', 'CONVERTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>Showing {filteredProformas.length} quotes</span>
        <span>
          Total Pipeline Value: <strong className="text-white">{formatUSD(totalProformaValue)}</strong>
        </span>
      </div>

      {/* Proformas Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Proforma #</th>
                <th>Customer / Company</th>
                <th>Manager</th>
                <th>Issue Date</th>
                <th>Total Value (USD)</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProformas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-brand-400 flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No Proforma Quotations Found</h4>
                      <p className="text-xs text-slate-400">
                        Draft commercial wholesale quotes with multi-depot stock reservation and email them to clients.
                      </p>
                      <Link
                        href="/proformas/new"
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create New Proforma</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProformas.map((pf) => {
                  const badge = getStatusBadgeClasses(pf.status);
                  return (
                    <tr key={pf.id}>
                      <td>
                        <Link
                          href={`/proformas/${pf.id}`}
                          className="font-mono font-bold text-brand-400 hover:underline text-xs"
                        >
                          {pf.proformaNumber}
                        </Link>
                        {pf.convertedToInvoiceNumber && (
                          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                            <CheckCircle className="h-3 w-3" />
                            <span>Inv: {pf.convertedToInvoiceNumber}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-white text-xs">{pf.customerCompany}</div>
                        <div className="text-[10px] text-slate-400">{pf.customerName} • {pf.customerEmail}</div>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300">{pf.managerName}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-400">{formatDate(pf.issueDate)}</span>
                      </td>
                      <td className="font-mono font-bold text-xs text-white">
                        {formatUSD(pf.grandTotal)}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {pf.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDoc(pf)}
                            title="Print / Save PDF"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            href={`/proformas/${pf.id}`}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Modal */}
      {selectedDoc && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentType="PROFORMA"
          data={selectedDoc}
        />
      )}
    </div>
  );
}
