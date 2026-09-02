'use client';

import React, { useState, useEffect } from 'react';
import { ScrollText, Mail, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { AuditLog, EmailLog } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/Input';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'audit' | 'notifications'>('audit');
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Email notifications state
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  const loadAuditData = async () => {
    setAuditError(null);
    setAuditLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      } else {
        setAuditError('Unable to load the audit trail.');
      }
    } catch {
      setAuditError('Something went wrong. Please try again.');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadEmailData = async () => {
    setEmailError(null);
    setEmailLoading(true);
    try {
      const res = await fetch('/api/notifications/logs');
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(Array.isArray(data) ? data : []);
      } else {
        setEmailError('Unable to load notification logs.');
      }
    } catch {
      setEmailError('Something went wrong loading notification history.');
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications' && emailLogs.length === 0) {
      loadEmailData();
    }
  }, [activeTab]);

  const handleRetry = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const res = await fetch('/api/notifications/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');

      toast({ title: 'Email Retried', description: data.message, variant: 'success' });
      await loadEmailData();
    } catch (err: any) {
      toast({ title: 'Retry Failed', description: err.message, variant: 'error' });
    } finally {
      setRetryingLogId(null);
    }
  };

  const filteredAudit = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.userName || '').toLowerCase().includes(q) ||
      (log.entityLabel || '').toLowerCase().includes(q) ||
      (log.description || '').toLowerCase().includes(q)
    );
  });

  const filteredEmail = emailLogs.filter((log) => {
    if (!emailSearch.trim()) return true;
    const q = emailSearch.toLowerCase();
    return (
      (log.recipientEmail || '').toLowerCase().includes(q) ||
      (log.subject || '').toLowerCase().includes(q) ||
      (log.relatedEntityRef || '').toLowerCase().includes(q) ||
      (log.notificationType || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="06 / SYSTEM & SECURITY"
        title="Audit Logs & Transactional Notifications"
        description="Immutable record of business activity and transactional email dispatch logs."
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'audit'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted hover:text-ink hover:bg-surface-muted'
          }`}
        >
          <ScrollText className="h-4 w-4" />
          <span>System Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'notifications'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted hover:text-ink hover:bg-surface-muted'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Email Notifications Log ({emailLogs.length})</span>
        </button>
      </div>

      {activeTab === 'audit' ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              placeholder="Search action, user, or record..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              wrapperClassName="w-full sm:w-96"
            />
            <span className="text-xs text-muted sm:ml-auto">{filteredAudit.length} audit entries</span>
          </div>

          {auditLoading ? (
            <SkeletonTable rows={8} cols={5} />
          ) : auditError ? (
            <ErrorState description={auditError} action={<Button onClick={loadAuditData}>Try Again</Button>} />
          ) : filteredAudit.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title={auditLogs.length === 0 ? 'No activity recorded yet' : 'No matching audit entries'}
              description={
                auditLogs.length === 0
                  ? 'System activity will appear here as users create proformas, convert invoices, and move stock.'
                  : 'No audit entries match your search.'
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Description</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredAudit.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted whitespace-nowrap">{formatDateTime(log.timestamp)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-ink">{log.userName}</div>
                        <div className="text-xs text-muted mt-0.5">{log.userRole?.replace(/_/g, ' ')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-ink">{log.entityLabel}</TableCell>
                      <TableCell className="text-muted max-w-md">{log.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              placeholder="Search recipient, invoice #, subject..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              wrapperClassName="w-full sm:w-96"
            />
            <Button
              size="sm"
              variant="outline"
              iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={loadEmailData}
              loading={emailLoading}
              className="sm:ml-auto text-xs"
            >
              Refresh Logs
            </Button>
          </div>

          {emailLoading && emailLogs.length === 0 ? (
            <SkeletonTable rows={8} cols={6} />
          ) : emailError ? (
            <ErrorState description={emailError} action={<Button onClick={loadEmailData}>Try Again</Button>} />
          ) : filteredEmail.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={emailLogs.length === 0 ? 'No email notifications logged' : 'No matching email logs'}
              description={
                emailLogs.length === 0
                  ? 'Transactional email notifications will appear here when tax invoices are created or shipments are dispatched.'
                  : 'No email notification records match your search.'
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableHead>Sent / Logged Time</TableHead>
                  <TableHead>Notification Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Invoice / Shipment</TableHead>
                  <TableHead>Delivery Status</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredEmail.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted whitespace-nowrap">
                        {formatDateTime(log.sentAt || log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {log.notificationType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-ink text-xs">{log.recipientEmail}</div>
                        {log.recipientName && <div className="text-[11px] text-muted">{log.recipientName}</div>}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-xs text-ink">{log.relatedEntityRef}</span>
                      </TableCell>
                      <TableCell>
                        {log.status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            SENT
                          </span>
                        ) : log.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={log.failureReason || ''}>
                            <AlertTriangle className="h-3 w-3" />
                            FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="h-3 w-3" />
                            PENDING
                          </span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={retryingLogId === log.id}
                          onClick={() => handleRetry(log.id)}
                          className="text-xs h-7 px-2 border-line hover:bg-surface-muted"
                        >
                          Retry Email
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
