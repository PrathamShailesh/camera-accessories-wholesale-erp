'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  UploadCloud,
  Search,
  Filter,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Tag,
  Eye,
  Building2,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatFileSize, formatDateTime } from '@/lib/utils';
import { CloudDocument, DocumentCategory } from '@/types/erp';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';

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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this document from the hub?')) {
      dataStore.deleteCloudDocument(id);
      loadData();
    }
  };

  const getCategoryBadgeClass = (cat: DocumentCategory) => {
    switch (cat) {
      case 'AIRWAY_BILL':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'TAX_INVOICE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PROFORMA':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'PACKING_LIST':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-400 text-sm">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Centralized Cloud Documents Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global repository powered by Cloudinary (<code>camera-erp-dev2</code>). Store and access Airway Bills, Invoices, Certificates & Inspection photos.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Document / Photo</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document title, tags or entity..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { label: 'All Docs', value: 'ALL' },
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === tab.value
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-xs">
            <FolderLock className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <span>No documents found matching the filter criteria.</span>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(doc.fileFormat.toLowerCase());

            return (
              <div
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="glass-panel-interactive p-5 rounded-2xl border border-slate-800 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getCategoryBadgeClass(
                        doc.category
                      )}`}
                    >
                      {doc.category.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      title="Delete Document"
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                      {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 line-clamp-1">
                        {doc.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.fileName}</p>
                    </div>
                  </div>

                  {/* Entity link */}
                  <div className="mt-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                    <span className="text-slate-500 block text-[10px] font-mono">Linked Entity:</span>
                    <span className="text-slate-300 font-medium line-clamp-1">
                      {doc.relatedEntityLabel || doc.relatedEntityType}
                    </span>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {doc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>{formatDateTime(doc.uploadedAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cloudinary Upload Modal */}
      <CloudinaryUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => loadData()}
      />

      {/* Document Full-Screen Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div>
                <h3 className="text-sm font-bold text-white">{previewDoc.title}</h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Cloudinary URL: {previewDoc.cloudinaryUrl}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Original</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto flex flex-col items-center justify-center bg-slate-950">
              {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(previewDoc.fileFormat.toLowerCase()) ? (
                <div className="w-full flex flex-col items-center">
                  <img
                    src={previewDoc.cloudinaryUrl}
                    alt={previewDoc.title}
                    onError={(e) => {
                      // Fallback to a clean placeholder card
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = document.getElementById(`doc-fallback-${previewDoc.id}`);
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    className="max-h-[55vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                  />
                  <div
                    id={`doc-fallback-${previewDoc.id}`}
                    style={{ display: 'none' }}
                    className="flex flex-col items-center justify-center py-12 text-center space-y-3"
                  >
                    <FileText className="h-16 w-16 text-cyan-400 mx-auto" />
                    <div className="text-sm font-bold text-white">{previewDoc.title}</div>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {previewDoc.relatedEntityLabel || previewDoc.fileName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4 max-w-md">
                  <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{previewDoc.fileName}</div>
                    <p className="text-xs text-slate-400 mt-1">
                      {previewDoc.category.replace(/_/g, ' ')} • {formatFileSize(previewDoc.fileSize)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {previewDoc.relatedEntityLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <a
                      href={previewDoc.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow"
                    >
                      <span>Open Document in CDN</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
