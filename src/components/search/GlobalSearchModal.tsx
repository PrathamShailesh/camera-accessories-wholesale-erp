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
import dataStore from '@/lib/data-store';

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
      if (query.trim()) {
        setResults(dataStore.searchGlobal(query));
      } else {
        // Show recent / sample shortcuts
        setResults(dataStore.searchGlobal('INV'));
      }
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
        return <Receipt className="h-4 w-4 text-emerald-400" />;
      case 'Proforma Invoices':
        return <FileCheck2 className="h-4 w-4 text-cyan-400" />;
      case 'Products & Inventory':
        return <Package className="h-4 w-4 text-indigo-400" />;
      case 'Serial Numbers':
        return <Barcode className="h-4 w-4 text-amber-400" />;
      case 'Customers':
        return <Users className="h-4 w-4 text-rose-400" />;
      case 'Shipments & Airway Bills':
        return <Truck className="h-4 w-4 text-sky-400" />;
      default:
        return <FolderLock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="h-5 w-5 text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Invoices (INV-10291), Serials (CR5-001), AWBs, SKUs..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching records found for &quot;<span className="text-white font-medium">{query}</span>&quot;
            </div>
          ) : (
            results.map((res, i) => (
              <button
                key={i}
                onClick={() => handleSelect(res.link)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(res.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white group-hover:text-brand-300">
                        {res.title}
                      </span>
                      {res.badge && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                          {res.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{res.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-brand-400">
                  <span className="hidden sm:inline font-mono">{res.category}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Try: <span className="text-slate-400 font-mono">INV-2026-00001</span>, <span className="text-slate-400 font-mono">CR5-001</span>, <span className="text-slate-400 font-mono">DHL-9482103847</span></span>
          </div>
          <span className="font-mono">Press ↵ to open</span>
        </div>
      </div>
    </div>
  );
}
