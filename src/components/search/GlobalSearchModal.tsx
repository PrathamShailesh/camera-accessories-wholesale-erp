'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Receipt,
  FileCheck2,
  Package,
  Barcode,
  Users,
  Truck,
  FolderLock,
  ArrowRight,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);

      const q = query.trim();
      if (!q) {
        setResults([]);
        return;
      }

      const abortCtrl = new AbortController();
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: abortCtrl.signal })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => {
          setResults(Array.isArray(data.results) ? data.results : []);
        })
        .catch(() => {});

      return () => abortCtrl.abort();
    }
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleSelect = (link: string) => {
    onClose();
    router.push(link);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Tax Invoices':
        return <Receipt className="h-4 w-4 text-emerald-600" />;
      case 'Proforma Invoices':
        return <FileCheck2 className="h-4 w-4 text-brand-600" />;
      case 'Products & Inventory':
        return <Package className="h-4 w-4 text-sky-600" />;
      case 'Serial Numbers':
        return <Barcode className="h-4 w-4 text-amber-600" />;
      case 'Customers':
        return <Users className="h-4 w-4 text-rose-600" />;
      case 'Shipments & Airway Bills':
        return <Truck className="h-4 w-4 text-blue-600" />;
      default:
        return <FolderLock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <Search className="h-4 w-4 text-brand-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Invoices (INV-2026), Serials, AWBs, SKUs, Customers..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500 hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-0.5">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching records found for &quot;<span className="text-slate-700 font-medium">{query}</span>&quot;
            </div>
          ) : (
            results.map((res, i) => (
              <button
                key={i}
                onClick={() => handleSelect(res.link)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                    {getCategoryIcon(res.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-brand-600">
                        {res.title}
                      </span>
                      {res.badge && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                          {res.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{res.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-brand-600">
                  <span className="hidden sm:inline font-mono text-[10px] text-slate-400">{res.category}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Try: <span className="text-slate-700 font-mono">INV-2026-00001</span>, <span className="text-slate-700 font-mono">SONY-A7IV</span></span>
          </div>
          <span className="font-mono text-[10px]">Press ↵ to select</span>
        </div>
      </div>
    </div>
  );
}
