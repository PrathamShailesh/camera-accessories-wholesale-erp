'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  UploadCloud,
  Search,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  X,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatFileSize, formatDateTime } from '@/lib/utils';
import { CloudDocument, DocumentCategory } from '@/types/erp';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CloudDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CloudDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load documents');
        setDocuments(dataStore.getDocuments());
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setDocuments(dataStore.getDocuments());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.relatedEntityLabel.toLowerCase().includes(q) ||
        doc.tags?.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this document from the hub?')) {
      try {
        const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Unable to delete the document');
        }
        setPreviewDoc((current) => (current?.id === id ? null : current));
        await loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Unable to delete document');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-500 text-xs font-medium">Loading Cloudinary document repository...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="05 / DOCUMENTS"
        title="Documents"
        description="One place for every commercial document — AWBs, invoices, proformas, and certificates."
        actions={
          <Button iconLeft={<UploadCloud className="h-4 w-4" />} onClick={() => setIsUploadOpen(true)}>
            Upload Document
          </Button>
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
            placeholder="Search title, filename, SKU, AWB or customer..."
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { label: 'All Documents', value: 'ALL' },
            { label: 'Airway Bills', value: 'AIRWAY_BILL' },
            { label: 'Tax Invoices', value: 'TAX_INVOICE' },
            { label: 'Proformas', value: 'PROFORMA' },
            { label: 'Packing Lists', value: 'PACKING_LIST' },
            { label: 'Certificates', value: 'CERTIFICATE' },
            { label: 'Other', value: 'OTHER' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === tab.value
                  ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <Card className="col-span-full py-16 text-center text-slate-500 text-xs">
            <FolderLock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <span>No documents found matching criteria.</span>
          </Card>
        ) : (
          filteredDocs.map((doc) => {
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(doc.fileFormat.toLowerCase());

            return (
              <Card
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="p-4 flex flex-col justify-between cursor-pointer hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge tone="info">{doc.category.replace(/_/g, ' ')}</Badge>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      title="Delete Document"
                      className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-brand-600">
                      {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 line-clamp-1">
                        {doc.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{doc.fileName}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <span className="text-slate-400 block text-[10px]">Linked Entity:</span>
                    <span className="font-medium truncate block">{doc.relatedEntityLabel || doc.relatedEntityType}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>{formatDateTime(doc.uploadedAt)}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <CloudinaryUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => loadData()}
      />

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
                <p className="text-[11px] font-mono text-slate-400">{previewDoc.fileName}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto flex flex-col items-center justify-center bg-slate-100">
              {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(previewDoc.fileFormat.toLowerCase()) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.cloudinaryUrl}
                  alt={previewDoc.title}
                  className="max-h-[50vh] max-w-full rounded-md object-contain border border-slate-200"
                />
              ) : (
                <div className="text-center py-8 space-y-3">
                  <FileText className="h-12 w-12 text-brand-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-900">{previewDoc.fileName}</div>
                  <a
                    href={previewDoc.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-brand-600 text-white text-xs font-semibold"
                  >
                    Open Document Link <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
