'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  previewHeightClass?: string;
  fallbackIcon?: React.ReactNode;
}

export default function ImageUploadField({
  value,
  onChange,
  label = 'Product Image',
  placeholder = 'https://images.unsplash.com/... or upload a local file',
  previewHeightClass = 'h-32',
  fallbackIcon,
}: ImageUploadFieldProps) {
  const [mode, setMode] = useState<'UPLOAD' | 'URL'>(value && value.startsWith('http') && !value.startsWith('data:') ? 'URL' : 'UPLOAD');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      onChange(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Label and mode toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-slate-300 font-medium">{label}</label>
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('UPLOAD')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              mode === 'UPLOAD'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-3 w-3" />
            <span>Upload Device</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('URL')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              mode === 'URL'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-3 w-3" />
            <span>Paste URL</span>
          </button>
        </div>
      </div>

      {/* Upload or URL input control */}
      {mode === 'UPLOAD' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />

          {!value ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-700 hover:border-brand-500/60 bg-slate-950/60 hover:bg-slate-900/60'
              }`}
            >
              <div className="mx-auto w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-white">Click to browse or drag & drop image</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WebP, GIF (Max 10MB)</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder={placeholder}
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange(e.target.value);
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            {urlInput && (
              <button
                type="button"
                onClick={handleUrlApply}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Box when image is set */}
      {value && (
        <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-2 flex items-center gap-3">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-black border border-slate-800 shrink-0 relative flex items-center justify-center">
            <img
              src={value}
              alt="Preview"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800';
              }}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <Check className="h-3.5 w-3.5" />
              <span>Image Attached</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
              {value.startsWith('data:') ? 'Local file (Base64 ready)' : value}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'UPLOAD') fileInputRef.current?.click();
                  else fileInputRef.current?.click();
                }}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline"
              >
                Change photo
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
