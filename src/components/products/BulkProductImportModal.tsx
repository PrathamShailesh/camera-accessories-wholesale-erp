'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  rowNum: number;
  sku: string;
  name: string;
  brand: string;
  model?: string;
  category: string;
  description?: string;
  barcode?: string;
  purchasePrice: number;
  wholesalePrice: number;
  sellingPrice: number;
  taxRate: number;
  minStockLevel: number;
  trackSerial: boolean;
  imageUrl?: string;
  blrStock: number;
  dxbStock: number;
  bomStock: number;
  sinStock: number;
  isValid: boolean;
  errors: string[];
}

export default function BulkProductImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [filterView, setFilterView] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    failed: number;
    errors: { row: number; sku?: string; error: string }[];
  } | null>(null);

  if (!isOpen) return null;

  // 1. Template Downloader
  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const headers = [
      'sku',
      'name',
      'brand',
      'model',
      'category',
      'description',
      'barcode',
      'purchasePrice',
      'wholesalePrice',
      'sellingPrice',
      'taxRate',
      'minStockLevel',
      'trackSerial',
      'imageUrl',
      'blrStock',
      'dxbStock',
      'bomStock',
      'sinStock',
    ];

    const sampleRows = [
      {
        sku: 'SONY-A7M4',
        name: 'Sony Alpha 7 IV Full-Frame Camera Body',
        brand: 'Sony',
        model: 'ILCE-7M4',
        category: 'Camera Bodies',
        description: '33MP Full-Frame Exmor R CMOS Sensor with 4K 60p 10-Bit Recording',
        barcode: '4548736133730',
        purchasePrice: 1800,
        wholesalePrice: 2150,
        sellingPrice: 2498,
        taxRate: 5,
        minStockLevel: 10,
        trackSerial: 'TRUE',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        blrStock: 15,
        dxbStock: 25,
        bomStock: 10,
        sinStock: 8,
      },
      {
        sku: 'CANON-RF-50-12',
        name: 'Canon RF 50mm f/1.2 L USM Prime Lens',
        brand: 'Canon',
        model: 'RF5012L',
        category: 'Cinema Lenses',
        description: 'Ultra-fast prime lens with ring-type USM and weather-sealed build',
        barcode: '4549292115598',
        purchasePrice: 1650,
        wholesalePrice: 1950,
        sellingPrice: 2299,
        taxRate: 5,
        minStockLevel: 5,
        trackSerial: 'TRUE',
        imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800',
        blrStock: 10,
        dxbStock: 12,
        bomStock: 6,
        sinStock: 4,
      },
      {
        sku: 'APUT-300D2',
        name: 'Aputure Light Storm C300d Mark II LED Light',
        brand: 'Aputure',
        model: 'LS-C300DII',
        category: 'Professional Lighting & Flashes',
        description: '5500K daylight-balanced point source LED fixture with 2.4G remote',
        barcode: '6952968302213',
        purchasePrice: 650,
        wholesalePrice: 790,
        sellingPrice: 949,
        taxRate: 5,
        minStockLevel: 8,
        trackSerial: 'FALSE',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
        blrStock: 8,
        dxbStock: 14,
        bomStock: 5,
        sinStock: 5,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product_Import_Template');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'lenscore_product_import_template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'lenscore_product_import_template.csv', { bookType: 'csv' });
    }
  };

  // 2. Process Uploaded File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (fileToProcess: File) => {
    setFile(fileToProcess);
    setIsParsing(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          alert('Uploaded file contains no rows or headers.');
          setIsParsing(false);
          return;
        }

        // Validate each row
        const seenSkus = new Set<string>();
        const parsed: ParsedRow[] = rawJson.map((row, idx) => {
          const rowNum = idx + 2; // header is row 1
          const errors: string[] = [];

          // Case-insensitive key lookup helper
          const getVal = (key: string) => {
            const matchKey = Object.keys(row).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase()
            );
            return matchKey ? String(row[matchKey]).trim() : '';
          };

          const sku = getVal('sku').toUpperCase();
          const name = getVal('name');
          const brand = getVal('brand');
          const category = getVal('category') || getVal('categoryName') || 'General Optics';
          const model = getVal('model');
          const description = getVal('description');
          const barcode = getVal('barcode');
          const imageUrl = getVal('imageUrl');

          const purchasePrice = parseFloat(getVal('purchasePrice')) || 0;
          const wholesalePrice = parseFloat(getVal('wholesalePrice')) || 0;
          const sellingPrice = parseFloat(getVal('sellingPrice')) || 0;
          const taxRate = parseFloat(getVal('taxRate')) || 5;
          const minStockLevel = parseInt(getVal('minStockLevel')) || 10;

          const blrStock = parseInt(getVal('blrStock')) || 0;
          const dxbStock = parseInt(getVal('dxbStock')) || 0;
          const bomStock = parseInt(getVal('bomStock')) || 0;
          const sinStock = parseInt(getVal('sinStock')) || 0;

          const trackSerialRaw = getVal('trackSerial').toLowerCase();
          const trackSerial =
            trackSerialRaw === 'true' ||
            trackSerialRaw === 'yes' ||
            trackSerialRaw === '1' ||
            trackSerialRaw === '';

          // Validation Rules
          if (!sku) errors.push('Missing SKU');
          if (!name) errors.push('Missing Product Name');
          if (!brand) errors.push('Missing Brand');
          if (purchasePrice <= 0) errors.push('Purchase Price must be > 0');
          if (wholesalePrice <= 0) errors.push('Wholesale Price must be > 0');
          if (sellingPrice <= 0) errors.push('Selling Price must be > 0');
          if (wholesalePrice < purchasePrice)
            errors.push('Wholesale price cannot be lower than purchase cost');

          if (seenSkus.has(sku)) {
            errors.push(`Duplicate SKU "${sku}" inside spreadsheet`);
          } else if (sku) {
            seenSkus.add(sku);
          }

          return {
            rowNum,
            sku,
            name,
            brand,
            model,
            category,
            description,
            barcode,
            purchasePrice,
            wholesalePrice,
            sellingPrice,
            taxRate,
            minStockLevel,
            trackSerial,
            imageUrl,
            blrStock,
            dxbStock,
            bomStock,
            sinStock,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(parsed);
      } catch (err: any) {
        alert(`Failed to parse file: ${err.message || 'Unknown format'}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(fileToProcess);
  };

  // 3. Confirm and Execute Bulk Import
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      const payload = validRows.map((r) => ({
        sku: r.sku,
        name: r.name,
        brand: r.brand,
        model: r.model,
        categoryName: r.category,
        description: r.description,
        barcode: r.barcode,
        purchasePrice: r.purchasePrice,
        wholesalePrice: r.wholesalePrice,
        sellingPrice: r.sellingPrice,
        taxRate: r.taxRate,
        minStockLevel: r.minStockLevel,
        trackSerial: r.trackSerial,
        imageUrl: r.imageUrl,
        depotBreakdown: {
          'dep-blr': r.blrStock,
          'dep-dxb': r.dxbStock,
          'dep-bom': r.bomStock,
          'dep-sin': r.sinStock,
        },
      }));

      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import request failed');
      }

      setImportSummary({
        total: parsedRows.length,
        imported: data.importedCount,
        failed: data.failedCount + (parsedRows.length - validRows.length),
        errors: data.errors || [],
      });

      onSuccess();
    } catch (err: any) {
      alert(`Bulk Import Error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const displayRows = parsedRows.filter((r) => {
    if (filterView === 'VALID') return r.isValid;
    if (filterView === 'INVALID') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-full max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Bulk Product Import</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Batch on-board camera optics, SKUs, wholesale margins & initial depot stock with automatic validation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                onClick={() => handleDownloadTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                title="Download CSV Template"
              >
                <Download className="h-3.5 w-3.5 text-brand-400" />
                <span>CSV Template</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors"
                title="Download Excel Template"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Excel (.xlsx) Template</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Import Summary Results Modal Banner */}
          {importSummary && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-brand-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Import Process Completed</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Total Processed: {importSummary.total}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <div className="font-bold text-lg font-mono">{importSummary.imported}</div>
                  <div>Products Successfully Created in Database</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <div className="font-bold text-lg font-mono">{importSummary.failed}</div>
                  <div>Rows Skipped / Failed Validation</div>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 max-h-32 overflow-y-auto font-mono">
                  <div className="text-[11px] font-bold text-rose-400 uppercase">Failed Row Breakdown:</div>
                  {importSummary.errors.map((err, i) => (
                    <div key={i} className="text-slate-300 text-[11px] flex items-center gap-2">
                      <span className="text-slate-500">Row {err.row}:</span>
                      {err.sku && <span className="text-brand-400">[{err.sku}]</span>}
                      <span className="text-rose-300">{err.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Drop Zone */}
          {parsedRows.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Drag & drop your product spreadsheet here
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Supports Excel (.xlsx, .xls) and CSV files. Automatic column mapping for SKU, prices, tax rate, and multi-depot stock.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <span>Browse Files</span>
              </div>
            </div>
          )}

          {/* Parsed Rows Toolbar and KPI Bar */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-slate-400">File: </span>
                    <span className="font-bold text-white font-mono">{file?.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFile(null);
                      setImportSummary(null);
                    }}
                    className="text-[11px] text-brand-400 hover:text-brand-300 underline font-mono"
                  >
                    Change File
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterView('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                      filterView === 'ALL'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Rows ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterView('VALID')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                      filterView === 'VALID'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterView('INVALID')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                      filterView === 'INVALID'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    Errors ({invalidCount})
                  </button>
                </div>
              </div>

              {/* Pre-Import Preview Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 z-10">
                      <tr>
                        <th className="p-3 text-center w-12">Status</th>
                        <th className="p-3">SKU / Code</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Brand & Category</th>
                        <th className="p-3 text-right">Wholesale ($)</th>
                        <th className="p-3 text-right">MSRP ($)</th>
                        <th className="p-3 text-center">Initial Stock (BLR/DXB/BOM/SIN)</th>
                        <th className="p-3 text-center">Serial Track</th>
                        <th className="p-3">Validation Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {displayRows.map((row) => (
                        <tr
                          key={row.rowNum}
                          className={
                            row.isValid
                              ? 'hover:bg-slate-900/50 transition-colors'
                              : 'bg-rose-500/5 hover:bg-rose-500/10 transition-colors'
                          }
                        >
                          <td className="p-3 text-center">
                            {row.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-rose-400 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                            {row.sku || <span className="text-rose-400 italic">Missing</span>}
                          </td>
                          <td className="p-3 max-w-xs truncate text-slate-200">
                            {row.name || <span className="text-rose-400 italic">Missing</span>}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-white font-semibold">{row.brand}</span>
                            <span className="text-slate-500 text-[10px] block font-mono">
                              {row.category}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white whitespace-nowrap">
                            {formatUSD(row.wholesalePrice)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap">
                            {formatUSD(row.sellingPrice)}
                          </td>
                          <td className="p-3 text-center font-mono text-[11px] whitespace-nowrap">
                            <span className="text-slate-300">
                              {row.blrStock} / {row.dxbStock} / {row.bomStock} / {row.sinStock}
                            </span>
                            <span className="text-slate-500 text-[9px] block">
                              Total: {row.blrStock + row.dxbStock + row.bomStock + row.sinStock}
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {row.trackSerial ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-brand-500/20 text-brand-300 border border-brand-500/40">
                                Tracked
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] font-mono">No</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] max-w-xs">
                            {row.isValid ? (
                              <span className="text-emerald-400 font-mono text-[10px]">
                                Ready for database import
                              </span>
                            ) : (
                              <span className="text-rose-400 font-mono text-[10px] line-clamp-2">
                                {row.errors.join(' • ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-between p-4 px-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
          <div className="text-xs text-slate-400">
            {parsedRows.length > 0 && (
              <span>
                <strong className="text-white font-mono">{validCount}</strong> valid products ready to import
                {invalidCount > 0 && (
                  <span className="text-rose-400 ml-2">
                    ({invalidCount} invalid rows will be skipped)
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              {importSummary ? 'Close' : 'Cancel'}
            </button>

            {parsedRows.length > 0 && !importSummary && (
              <button
                onClick={handleConfirmImport}
                disabled={validCount === 0 || isImporting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-40"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Writing to Database...</span>
                  </>
                ) : (
                  <>
                    <span>Import {validCount} Products to Database</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
