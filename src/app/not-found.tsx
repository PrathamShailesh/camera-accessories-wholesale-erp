'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, Smartphone, Package, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-line rounded-3xl shadow-xl overflow-hidden text-center p-6 sm:p-10 animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-muted border border-line text-muted mb-6">
          <FileQuestion className="h-10 w-10 text-ink-secondary" />
        </div>

        <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-block mb-3">
          404 Error
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-muted mt-2 max-w-sm mx-auto leading-relaxed">
          The ERP module, page route, or document you are looking for does not exist or has been relocated.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
          <Link
            href="/dashboard"
            prefetch={false}
            className="flex flex-col p-3.5 rounded-xl border border-line hover:border-primary/40 hover:bg-surface transition-all group"
          >
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
            <span className="text-[10px] text-muted mt-1 leading-tight">
              Main ERP sales & stats
            </span>
          </Link>

          <Link
            href="/depot"
            prefetch={false}
            className="flex flex-col p-3.5 rounded-xl border border-line hover:border-emerald-500/40 hover:bg-emerald-50/40 transition-all group"
          >
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
              <Smartphone className="h-4 w-4" />
              <span>Depot Hub</span>
            </div>
            <span className="text-[10px] text-muted mt-1 leading-tight">
              Picking & dispatch
            </span>
          </Link>

          <Link
            href="/products"
            prefetch={false}
            className="flex flex-col p-3.5 rounded-xl border border-line hover:border-blue-500/40 hover:bg-blue-50/40 transition-all group"
          >
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs">
              <Package className="h-4 w-4" />
              <span>Catalog</span>
            </div>
            <span className="text-[10px] text-muted mt-1 leading-tight">
              Products & optics
            </span>
          </Link>
        </div>

        <div className="mt-6 pt-5 border-t border-line-soft flex items-center justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go back to previous page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
