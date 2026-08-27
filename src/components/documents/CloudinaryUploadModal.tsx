'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
  Image as ImageIcon,
  Tag,
  Building2,
} from 'lucide-react';
import { DocumentCategory, RelatedEntityType } from '@/types/erp';
import dataStore from '@/lib/data-store';

interface CloudinaryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: () => void;
  defaultCategory?: DocumentCategory;
  defaultEntityType?: RelatedEntityType;
  defaultEntityId?: string;
  defaultEntityLabel?: string;
}

export default function CloudinaryUploadModal({
  isOpen,
  onClose,
  onUploaded,
  defaultCategory = 'AIRWAY_BILL',
  defaultEntityType = 'SHIPMENT',
  defaultEntityId = '',
  defaultEntityLabel = '',
}: CloudinaryUploadModalProps) {
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
  const [relatedEntityType, setRelatedEntityType] = useState<RelatedEntityType>(defaultEntityType);
  const [relatedEntityId, setRelatedEntityId] = useState(defaultEntityId);
  const [relatedEntityLabel, setRelatedEntityLabel] = useState(defaultEntityLabel);
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileData) {
      setErrorMessage('Please select a file or take a photo first');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName,
          title: title || fileName,
          category,
          relatedEntityType,
          relatedEntityId,
          relatedEntityLabel: relatedEntityLabel || `${relatedEntityType} #${relatedEntityId}`,
          tags: tags ? tags.split(',').map((t) => t.trim()) : [category],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadSuccess(true);
      if (onUploaded) onUploaded();

      setTimeout(() => {
        setUploadSuccess(false);
        setFileData(null);
        setFileName('');
        setTitle('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Upload to Cloudinary Hub</h3>
              <p className="text-[11px] text-slate-400 font-mono">Bucket: camera-erp-dev2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {/* File Dropzone / Camera selector */}
          {!fileData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 hover:border-brand-500/50 hover:bg-slate-800/40 cursor-pointer transition-all text-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="h-10 w-10 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold text-white">Choose File / PDF</div>
                <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG, WebP up to 25MB</p>
              </div>

              {/* Camera Photo Picker (PWA / Mobile optimized) */}
              <div
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-800/40 cursor-pointer transition-all text-center group"
              >
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold text-white">Take Camera Photo</div>
                <p className="text-[11px] text-slate-400 mt-1">Capture package or Airway Bill</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {fileData.startsWith('data:image') ? (
                    <img src={fileData} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-6 w-6 text-brand-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white line-clamp-1">{fileName}</div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(fileSize / 1024).toFixed(1)} KB • Ready for CDN
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFileData(null);
                  setFileName('');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-rose-500/10"
              >
                Change
              </button>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Airway Bill DHL-9482103847"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Document Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="AIRWAY_BILL">Airway Bill (AWB)</option>
                <option value="TAX_INVOICE">Tax Invoice</option>
                <option value="PROFORMA">Proforma Invoice</option>
                <option value="PACKING_LIST">Packing List / Inspection</option>
                <option value="SHIPPING_DOCUMENT">Shipping Document</option>
                <option value="PURCHASE_INVOICE">Purchase Invoice</option>
                <option value="CUSTOMS_DOC">Customs / Export Doc</option>
                <option value="WARRANTY_DOCUMENT">Warranty Document</option>
                <option value="CERTIFICATE">Certificate of Origin</option>
                <option value="OTHER">Other Business Document</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Related Entity Type
              </label>
              <select
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value as RelatedEntityType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="SHIPMENT">Shipment</option>
                <option value="INVOICE">Tax Invoice</option>
                <option value="PROFORMA">Proforma</option>
                <option value="CUSTOMER">Customer</option>
                <option value="DEPOT">Depot</option>
                <option value="PRODUCT">Product</option>
                <option value="SUPPLIER">Supplier</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Entity Reference Label
              </label>
              <input
                type="text"
                value={relatedEntityLabel}
                onChange={(e) => setRelatedEntityLabel(e.target.value)}
                placeholder="e.g. CineGear Studios / INV-2026-00001"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Search Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. DHL, Dubai Hub, Fragile"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Document uploaded successfully to Cloudinary & Central Hub!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload & Register Doc</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
