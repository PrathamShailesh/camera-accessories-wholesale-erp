'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Activity,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatDateTime } from '@/lib/utils';
import { AuditLog } from '@/types/erp';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLogs(dataStore.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.entityLabel.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q)
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
            <ScrollText className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              System Audit Logs & Governance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log recording every proforma conversion, packing verification, price update & dispatch.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, user, or record..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator / User</th>
                <th>Action</th>
                <th>Target Record</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="text-slate-400">{formatDateTime(log.timestamp)}</td>
                  <td className="font-sans text-slate-200">
                    <div className="font-bold">{log.userName}</div>
                    <div className="text-[10px] text-brand-400 font-mono">{log.userRole}</div>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-white">
                      {log.action}
                    </span>
                  </td>
                  <td className="font-bold text-slate-300 font-sans">{log.entityLabel}</td>
                  <td className="font-sans text-slate-300 max-w-md">{log.description}</td>
                  <td className="text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
