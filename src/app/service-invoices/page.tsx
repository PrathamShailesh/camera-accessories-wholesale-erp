'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { ServiceInvoice, ServiceInvoiceStatus } from '@/types/erp';
import { formatUSD, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function ServiceInvoicesListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSendingEmail, setIsSendingEmail] = useState<Record<string, boolean>>({});

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

      const res = await fetch(`/api/service-invoices?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load service invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleSendInvoiceEmail = async (inv: ServiceInvoice) => {
    setIsSendingEmail((prev) => ({ ...prev, [inv.id]: true }));
    try {
      const res = await fetch(`/api/service-invoices/${inv.id}/email`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Service Invoice Sent',
          description: `Invoice #${inv.invoiceNumber} emailed to ${inv.customerEmail}`,
          variant: 'success',
        });

        // Update local status
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === inv.id
              ? {
                  ...i,
                  emailStatus: 'SENT',
                  status: i.status === 'DRAFT' ? 'SENT' : i.status,
                }
              : i
          )
        );
      } else {
        toast({
          title: 'Email Delivery Failed',
          description: data.error || 'Unable to send email',
          variant: 'error',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send email',
        variant: 'error',
      });
    } finally {
      setIsSendingEmail((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  // Metrics
  const totalServiceRevenue = invoices
    .filter((i) => i.status === 'PAID' || i.status === 'ISSUED' || i.status === 'SENT')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const pendingAmount = invoices
    .filter((i) => i.status === 'ISSUED' || i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const paidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const getStatusBadge = (status: ServiceInvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20';
      case 'ISSUED':
      case 'SENT':
        return 'bg-[#005E82]/10 text-[#005E82] border-[#005E82]/20';
      case 'PARTIALLY_PAID':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'OVERDUE':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#005E82]/10 flex items-center justify-center text-[#005E82]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
                Manual Service Invoices
              </h1>
              <p className="text-xs text-[#6B7280]">
                Billing for logistics, packaging, transport, installation & business services (separate from product inventory)
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/service-invoices/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#005E82] hover:bg-[#004B68] text-white text-xs font-bold shadow-xs transition-all active:scale-98 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Service Invoice</span>
        </Link>
      </div>

      {/* Separate Revenue Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Service Revenue</span>
            <div className="h-8 w-8 rounded-xl bg-[#005E82]/10 text-[#005E82] flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#005E82] mt-2">
            {formatUSD(totalServiceRevenue)}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1 block">Excludes product sales & inventory</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Paid Revenue</span>
            <div className="h-8 w-8 rounded-xl bg-[#15803D]/10 text-[#15803D] flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#15803D] mt-2">
            {formatUSD(paidAmount)}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1 block">Cleared service payments</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Pending Receivable</span>
            <div className="h-8 w-8 rounded-xl bg-[#F15A29]/10 text-[#F15A29] flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#F15A29] mt-2">
            {formatUSD(pendingAmount)}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1 block">Issued & awaiting settlement</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search service invoice number, customer company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs focus:border-[#005E82] focus:outline-none font-mono"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-[#6B7280] shrink-0" />
          {['ALL', 'DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#005E82] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Service Invoices Data Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-[#005E82] mx-auto" />
            <p className="text-xs text-[#6B7280] mt-2">Loading service invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-[#6B7280]/40 mx-auto" />
            <div className="text-sm font-bold text-[#111827]">No Service Invoices Found</div>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Create a manual service invoice to bill logistics, transport, packaging, or handling charges separately from product inventory.
            </p>
            <Link
              href="/service-invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005E82] text-white text-xs font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Service Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Services</th>
                  <th className="py-3.5 px-4">Issue / Due Date</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Email</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#005E82]">
                      <Link href={`/service-invoices/${inv.id}`} className="hover:underline">
                        #{inv.invoiceNumber}
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-[#111827]">{inv.customerCompany}</div>
                      <div className="text-[11px] text-[#6B7280]">{inv.customerName} • {inv.customerEmail}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(inv.items || []).slice(0, 2).map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#005E82]/5 border border-[#005E82]/15 text-[#005E82] text-[10px] font-mono font-semibold"
                          >
                            {item.category}: {item.description}
                          </span>
                        ))}
                        {(inv.items?.length || 0) > 2 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-[#6B7280] font-mono">
                            +{(inv.items?.length || 0) - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-[#6B7280]">
                      <div>Issue: {formatDate(inv.issueDate)}</div>
                      <div className="text-red-600 font-semibold">Due: {formatDate(inv.dueDate)}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-[#111827] text-sm">
                      {formatUSD(inv.grandTotal)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center font-mono text-[10px]">
                      {inv.emailStatus === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 text-[#15803D] font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">Not Sent</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendInvoiceEmail(inv)}
                          disabled={Boolean(isSendingEmail[inv.id])}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-[#005E82] hover:bg-[#005E82]/5 text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                          title="Send Service Invoice to Customer Email"
                        >
                          {isSendingEmail[inv.id] ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Email</span>
                        </button>

                        <Link
                          href={`/service-invoices/${inv.id}`}
                          className="p-1.5 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC] transition-all shadow-xs"
                          title="View Service Invoice Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
