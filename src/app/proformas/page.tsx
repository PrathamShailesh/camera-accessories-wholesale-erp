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
import { fetchWithCache } from '@/lib/client-cache';

export default function ProformasPage() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Proforma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWithCache<Proforma[]>('/api/proformas', undefined, force ? 0 : 15000);
      if (Array.isArray(data)) {
        setProformas(data);
      } else {
        setProformas([]);
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
            loadData(true);
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleApprove = async (proformaId: string) => {
    setApprovingId(proformaId);
    try {
      const res = await fetch(`/api/proformas/${proformaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      if (res.ok) {
        loadData(true);
      }
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setApprovingId(null);
    }
  };

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
        description="Create, approve, and convert customer quotations and sales proposals into tax invoices."
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

      {/* Summary Cards & Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500">Total Proformas</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{filteredProformas.length}</div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500">Pipeline Value</div>
          <div className="text-2xl font-bold text-brand-600 font-mono mt-1">{formatUSD(totalProformaValue)}</div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="text-xs font-semibold text-slate-500">Search & Filter</div>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search proforma #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['ALL', 'DRAFT', 'SENT', 'CONFIRMED', 'CONVERTED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              filterStatus === st
                ? 'bg-[#005E82] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-slate-200 bg-white">
        {filteredProformas.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No Proformas Found"
            description="Create a new proforma quotation to start tracking wholesale pipeline orders."
            action={
              <LinkButton href="/proformas/new" iconLeft={<Plus className="h-4 w-4" />}>
                New Proforma
              </LinkButton>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Proforma #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead align="right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {filteredProformas.map((pf) => (
                <TableRow key={pf.id}>
                  <TableCell>
                    <Link
                      href={`/proformas/${pf.id}`}
                      className="font-mono font-bold text-brand-600 hover:underline text-xs"
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
                    <div className="flex items-center justify-end gap-1.5">
                      {(pf.status === 'DRAFT' || pf.status === 'SENT') && (
                        <button
                          type="button"
                          onClick={() => handleApprove(pf.id)}
                          disabled={approvingId === pf.id}
                          className="px-2.5 py-1 rounded-md bg-[#005E82] hover:bg-[#004B68] text-white text-[11px] font-bold transition-all shadow-xs"
                        >
                          {approvingId === pf.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}

                      {pf.status === 'CONFIRMED' && (
                        <Link
                          href={`/proformas/${pf.id}`}
                          className="px-2.5 py-1 rounded-md bg-[#15803D] hover:bg-[#166534] text-white text-[11px] font-bold transition-all shadow-xs"
                        >
                          Convert
                        </Link>
                      )}

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
