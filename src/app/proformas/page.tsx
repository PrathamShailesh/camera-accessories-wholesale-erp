'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  PlusCircle,
  Search,
  Printer,
  Receipt,
  CheckCircle,
  AlertCircle,
  FileText,
  Plus,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate } from '@/lib/utils';
import { Proforma } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton, IconButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';

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
        <div className="text-slate-500 text-xs font-medium">Loading proforma quotations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="02 / SALES"
        title="Proformas"
        description="Create and manage customer quotations and sales proposals."
        actions={
          <LinkButton href="/proformas/new" iconLeft={<PlusCircle className="h-4 w-4" />}>
            New Proforma
          </LinkButton>
        }
      />

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Proforma # or Customer..."
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'DRAFT', 'SENT', 'CONFIRMED', 'CONVERTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Pipeline Summary Ribbon */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
        <span>Showing {filteredProformas.length} proformas</span>
        <span>
          Total Pipeline: <strong className="text-slate-900">{formatUSD(totalProformaValue)}</strong>
        </span>
      </div>

      {/* Proformas Table */}
      <Card className="overflow-hidden">
        {filteredProformas.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Proformas Found"
            description="Create your first proforma to start a new customer deal."
            action={
              <LinkButton href="/proformas/new" iconLeft={<Plus className="h-4 w-4" />}>
                Create Proforma
              </LinkButton>
            }
          />
        ) : (
          <Table className="border-0 rounded-none shadow-none">
            <TableHeader>
              <TableHead>Proforma #</TableHead>
              <TableHead>Customer / Company</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead align="right">Amount (USD)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {filteredProformas.map((pf) => (
                <TableRow key={pf.id}>
                  <TableCell>
                    <Link
                      href={`/proformas/${pf.id}`}
                      className="font-mono font-bold text-indigo-600 hover:underline text-xs"
                    >
                      {pf.proformaNumber}
                    </Link>
                    {pf.convertedToInvoiceNumber && (
                      <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                        <CheckCircle className="h-3 w-3" />
                        <span>Inv: {pf.convertedToInvoiceNumber}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-xs">{pf.customerCompany}</div>
                    <div className="text-[11px] text-slate-500">{pf.customerName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-600">{pf.managerName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">{formatDate(pf.issueDate)}</span>
                  </TableCell>
                  <TableCell align="right" className="font-mono font-bold text-xs text-slate-900">
                    {formatUSD(pf.grandTotal)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pf.status} />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton label="Print / PDF" onClick={() => setSelectedDoc(pf)}>
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                      </IconButton>
                      <LinkButton href={`/proformas/${pf.id}`} size="sm" variant="secondary">
                        View
                      </LinkButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
