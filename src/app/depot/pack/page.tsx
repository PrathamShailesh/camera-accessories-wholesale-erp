'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Camera,
  CheckCircle2,
  Upload,
  RefreshCw,
  X,
  FlipHorizontal,
  Eye,
  AlertCircle,
  Scale,
  Ruler,
  FileCheck,
  Building2,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Layers,
  Filter,
  Check,
} from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';
import { fetchCurrentUserCached, getCurrentUserCachedSync, fetchWithCache } from '@/lib/client-cache';
import { formatUSD, cloudinaryThumb } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function DepotPackPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUserCachedSync()?.user || null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UNPACKED' | 'PHOTO_ATTACHED' | 'PHOTO_PENDING' | 'PACKED'>('ALL');

  // Batch Multi-Select Packing State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [isBatchPacking, setIsBatchPacking] = useState(false);

  // Photo / Camera States
  const [activeInvoiceForPhoto, setActiveInvoiceForPhoto] = useState<TaxInvoice | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Stored photos per invoice (invoiceId -> photoUrl)
  const [packagePhotos, setPackagePhotos] = useState<Record<string, string>>({});
  const [packageWeights, setPackageWeights] = useState<Record<string, number>>({});
  const [packageBoxes, setPackageBoxes] = useState<Record<string, number>>({});
  const [packingNotes, setPackingNotes] = useState<Record<string, string>>({});
  const [previewingPhotoUrl, setPreviewingPhotoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    let user: User | null = null;

    try {
      const userData = await fetchCurrentUserCached();
      if (userData?.authenticated && userData.user) {
        user = userData.user;
        setCurrentUser(user);
      }
    } catch {}

    try {
      const allInvoices = await fetchWithCache<TaxInvoice[]>('/api/invoices', undefined, 10000);
      if (Array.isArray(allInvoices)) {
        const filtered = allInvoices.filter(
          (inv: any) =>
            (inv.fulfilmentStatus === 'READY_FOR_PACKING' ||
              inv.fulfilmentStatus === 'PROCESSING' ||
              inv.fulfilmentStatus === 'PACKED') &&
            (!user?.assignedDepotId || inv.depotId === user.assignedDepotId)
        );
        setInvoices(filtered);

        // Pre-populate existing photos
        const existingPhotos: Record<string, string> = {};
        filtered.forEach((inv: any) => {
          if (inv.packingDetails?.packagePhotoUrl) {
            existingPhotos[inv.id] = inv.packingDetails.packagePhotoUrl;
          }
        });
        setPackagePhotos(existingPhotos);
      }
    } catch (e) {
      console.error('Error loading pack invoices:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Camera Streaming Controls ──────────────────────────────────────────────
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    setCapturedImageData(null);

    // Stop existing stream if running
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream not supported by this browser. Use native mobile snap.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Webcam stream failed, fallback available:', err);
      setCameraError(err.message || 'Could not access camera. Please allow camera permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCapturedImageData(null);
  };

  const openCameraModal = (inv: TaxInvoice) => {
    setActiveInvoiceForPhoto(inv);
    setIsCameraModalOpen(true);
    startCamera(cameraFacingMode);
  };

  const closeCameraModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setActiveInvoiceForPhoto(null);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhotoSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImageData(dataUrl);

      // Stop video while previewing the snapshot
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setIsCameraActive(false);
      }
    }
  };

  // Mobile Native Camera Snap
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeInvoiceForPhoto) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      uploadCapturedPhoto(dataUrl, activeInvoiceForPhoto);
    };
    reader.readAsDataURL(file);
  };

  // Upload photo to Cloudinary
  const uploadCapturedPhoto = async (base64Data: string, invoice: TaxInvoice) => {
    setIsUploadingPhoto(true);
    try {
      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: `Package_${invoice.invoiceNumber}_${Date.now()}.jpg`,
          category: 'PACKAGE_PHOTO',
          relatedEntityType: 'INVOICE',
          relatedEntityId: invoice.id,
          relatedEntityLabel: `Package Photo for Invoice #${invoice.invoiceNumber}`,
          title: `Package Photo - ${invoice.customerCompany}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      const photoUrl = data.document?.cloudinaryUrl || data.document?.url;
      setPackagePhotos((prev) => ({ ...prev, [invoice.id]: photoUrl }));

      closeCameraModal();
    } catch (err: any) {
      alert(`Photo upload error: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ── Single Pack Order ─────────────────────────────────────────────────────
  const handlePackOrder = async (inv: TaxInvoice) => {
    const photoUrl = packagePhotos[inv.id];
    const weight = packageWeights[inv.id] || 4.5;
    const boxes = packageBoxes[inv.id] || 1;
    const notes = packingNotes[inv.id] || '';

    try {
      const res = await fetch(`/api/invoices/${inv.id}/pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packedBy: currentUser?.name || 'Depot Officer',
          packageCount: boxes,
          totalWeightKg: weight,
          dimensionsCm: { length: 40, width: 30, height: 25 },
          packagePhotoUrl: photoUrl || null,
          notes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Packing failed');
      }

      setInvoices((prev) =>
        prev.map((item) =>
          item.id === inv.id
            ? { ...item, fulfilmentStatus: 'PACKED' }
            : item
        )
      );

      // Remove from selection if was selected
      setSelectedInvoiceIds((prev) => {
        const next = new Set(prev);
        next.delete(inv.id);
        return next;
      });

      toast({
        title: 'Order Packed Successfully',
        description: `Invoice #${inv.invoiceNumber} is marked READY FOR DISPATCH.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Packing Error',
        description: err.message || 'Failed to pack order',
        variant: 'error',
      });
    }
  };

  // ── Batch Pack All Selected Orders at Once ────────────────────────────────
  const handleBatchPackSelected = async () => {
    if (selectedInvoiceIds.size === 0) return;
    setIsBatchPacking(true);

    try {
      const selectedInvoices = invoices.filter((i) => selectedInvoiceIds.has(i.id));

      for (const inv of selectedInvoices) {
        const photoUrl = packagePhotos[inv.id];
        const weight = packageWeights[inv.id] || 4.5;
        const boxes = packageBoxes[inv.id] || 1;

        await fetch(`/api/invoices/${inv.id}/pack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packedBy: currentUser?.name || 'Depot Officer',
            packageCount: boxes,
            totalWeightKg: weight,
            dimensionsCm: { length: 40, width: 30, height: 25 },
            packagePhotoUrl: photoUrl || null,
          }),
        });
      }

      // Mark all selected as PACKED
      setInvoices((prev) =>
        prev.map((item) =>
          selectedInvoiceIds.has(item.id)
            ? { ...item, fulfilmentStatus: 'PACKED' }
            : item
        )
      );
      setSelectedInvoiceIds(new Set());

      toast({
        title: 'Batch Pack Complete',
        description: `${selectedInvoices.length} orders packed and ready for shipping.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Batch Packing Error',
        description: err.message || 'Some orders could not be packed',
        variant: 'error',
      });
    } finally {
      setIsBatchPacking(false);
    }
  };

  // Toggle Single Selection
  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Select All Visible
  const toggleSelectAll = () => {
    const unpackableVisible = filteredInvoices.filter((i) => i.fulfilmentStatus !== 'PACKED');
    if (selectedInvoiceIds.size === unpackableVisible.length && unpackableVisible.length > 0) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(unpackableVisible.map((i) => i.id)));
    }
  };

  // ── Filtered and Searched Invoices ────────────────────────────────────────
  const filteredInvoices = invoices.filter((invoice) => {
    const hasPhoto = Boolean(packagePhotos[invoice.id]);
    const isPacked = invoice.fulfilmentStatus === 'PACKED';

    if (filterType === 'UNPACKED' && isPacked) return false;
    if (filterType === 'PACKED' && !isPacked) return false;
    if (filterType === 'PHOTO_ATTACHED' && !hasPhoto) return false;
    if (filterType === 'PHOTO_PENDING' && hasPhoto) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchInv = invoice.invoiceNumber?.toLowerCase().includes(q);
      const matchCompany = invoice.customerCompany?.toLowerCase().includes(q);
      const matchItem = invoice.items?.some(
        (item: any) =>
          item.productName?.toLowerCase().includes(q) ||
          item.productSku?.toLowerCase().includes(q) ||
          item.allocatedSerials?.some((s: string) => s.toLowerCase().includes(q))
      );
      return matchInv || matchCompany || matchItem;
    }

    return true;
  });

  const unpackableCount = invoices.filter((i) => i.fulfilmentStatus !== 'PACKED').length;
  const packedCount = invoices.filter((i) => i.fulfilmentStatus === 'PACKED').length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-24">
      {/* Hidden Mobile Native Camera Input */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraCapture}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Package className="h-6 w-6 text-[#F15A29]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              Package & Photo Verification Station
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#F15A29]/10 text-[#F15A29] border border-[#F15A29]/20 font-bold">
              {invoices.length} Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Depot packing bench: Search orders, multi-select for batch packing, snap live box photos, and record parcel weights.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#111827] text-xs hover:bg-[#F8FAFC] self-start sm:self-auto transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Search & Fast Batch Multi-Select Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E7EB] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by Invoice # (e.g. INV-2026-00001), Customer, SKU, or Serial Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] placeholder-[#9CA3AF] text-xs focus:border-[#005E82] focus:bg-white focus:outline-none transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'ALL'
                  ? 'bg-[#005E82] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#111827] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setFilterType('UNPACKED')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'UNPACKED'
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#B45309] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              To Pack ({unpackableCount})
            </button>
            <button
              onClick={() => setFilterType('PHOTO_ATTACHED')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'PHOTO_ATTACHED'
                  ? 'bg-[#005E82] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#005E82] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              With Photo ({Object.keys(packagePhotos).length})
            </button>
            <button
              onClick={() => setFilterType('PACKED')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'PACKED'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:text-[#15803D] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              Packed ({packedCount})
            </button>
          </div>
        </div>

        {/* Multi-Select Select All Row */}
        {unpackableCount > 0 && (
          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[#4B5563] hover:text-[#111827] font-medium"
            >
              {selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === filteredInvoices.filter(i => i.fulfilmentStatus !== 'PACKED').length ? (
                <CheckSquare className="h-4 w-4 text-[#F15A29]" />
              ) : (
                <Square className="h-4 w-4 text-[#9CA3AF]" />
              )}
              <span>Select all visible unpackable orders ({filteredInvoices.filter(i => i.fulfilmentStatus !== 'PACKED').length})</span>
            </button>

            {selectedInvoiceIds.size > 0 && (
              <span className="text-[#F15A29] font-mono font-bold">
                {selectedInvoiceIds.size} orders selected for batch packing
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Order Queue */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E7EB] space-y-3 shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-[#005E82] mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading packing queue...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] space-y-3 shadow-xs">
          <CheckCircle2 className="h-12 w-12 text-[#15803D] mx-auto opacity-80" />
          <h3 className="text-base font-bold text-[#111827]">No Orders Found</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            {searchQuery
              ? `No packing orders matched "${searchQuery}". Clear your search or try another SKU / invoice number.`
              : 'There are no orders pending packing in this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredInvoices.map((invoice) => {
            const hasPhoto = Boolean(packagePhotos[invoice.id]);
            const isPacked = invoice.fulfilmentStatus === 'PACKED';
            const isSelected = selectedInvoiceIds.has(invoice.id);

            return (
              <div
                key={invoice.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 space-y-5 shadow-xs transition-all ${
                  isSelected
                    ? 'border-[#F15A29] ring-1 ring-[#F15A29]/40 bg-[#F15A29]/5'
                    : isPacked
                    ? 'border-[#E5E7EB] bg-[#F8FAFC]/50'
                    : 'border-[#E5E7EB] hover:border-[#005E82]/30 hover:shadow-md'
                }`}
              >
                {/* Top Info Bar with Checkbox */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-start gap-3">
                    {!isPacked && (
                      <button
                        type="button"
                        onClick={() => toggleSelectInvoice(invoice.id)}
                        className="mt-1 p-1 rounded-lg hover:bg-[#F8FAFC] text-[#9CA3AF] hover:text-[#111827] transition-colors"
                        title="Select for batch packing"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-[#F15A29]" />
                        ) : (
                          <Square className="h-5 w-5 text-[#9CA3AF]" />
                        )}
                      </button>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#005E82]">
                          #{invoice.invoiceNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            isPacked
                              ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20'
                              : 'bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/20'
                          }`}
                        >
                          {isPacked ? 'PACKED & READY TO SHIP' : 'IN PACKING'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#111827] mt-1">
                        {invoice.customerCompany}
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        Destination: {invoice.shippingAddress || 'Standard Delivery'} • {formatUSD(invoice.grandTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right text-xs">
                    <span className="text-[#6B7280] block text-[11px]">Items in Order</span>
                    <span className="text-[#111827] font-bold font-mono text-sm">
                      {invoice.items?.length || 0} Line Items
                    </span>
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-mono">
                    Package Line Items & Serials
                  </div>
                  <div className="space-y-2">
                    {invoice.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#111827]">{item.productName}</div>
                          <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                            SKU: {item.productSku} • {item.brand}
                          </div>
                          {item.allocatedSerials && item.allocatedSerials.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.allocatedSerials.map((sn: string, sidx: number) => (
                                <span
                                  key={sidx}
                                  className="px-1.5 py-0.5 rounded bg-[#005E82]/10 border border-[#005E82]/20 text-[#005E82] font-mono text-[10px]"
                                >
                                  SN: {sn}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] font-mono font-bold shadow-xs">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Package Photo & Weight Verification Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Left: Camera & Package Photo Box */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#111827] font-mono">
                        <Camera className="h-4 w-4 text-[#005E82]" />
                        <span>Package Photo Verification</span>
                      </div>
                      {hasPhoto ? (
                        <span className="text-[10px] font-mono text-[#15803D] bg-[#15803D]/10 border border-[#15803D]/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Photo Attached</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#B45309] bg-[#B45309]/10 border border-[#B45309]/30 px-2 py-0.5 rounded-full font-bold">
                          Photo Recommended
                        </span>
                      )}
                    </div>

                    {hasPhoto ? (
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPreviewingPhotoUrl(packagePhotos[invoice.id])}
                          className="relative h-20 w-28 rounded-xl overflow-hidden border border-[#E5E7EB] cursor-pointer group bg-[#F8FAFC] shrink-0"
                        >
                          <img
                            src={packagePhotos[invoice.id]}
                            alt="Package"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className="text-xs text-[#111827] font-medium truncate">
                            Box & Barcode Photo Recorded
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openCameraModal(invoice)}
                              className="text-[11px] font-semibold text-[#005E82] hover:underline font-mono"
                            >
                              Retake Photo
                            </button>
                            <span className="text-[#9CA3AF]">•</span>
                            <button
                              type="button"
                              onClick={() => setPreviewingPhotoUrl(packagePhotos[invoice.id])}
                              className="text-[11px] font-semibold text-[#6B7280] hover:text-[#111827] underline font-mono"
                            >
                              View Full Size
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-[#6B7280]">
                          Take a photo of the packed box and shipping label using the device camera for quality assurance:
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Primary Camera Click Button */}
                          <button
                            type="button"
                            onClick={() => openCameraModal(invoice)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#005E82] hover:bg-[#004B68] text-white text-xs font-bold shadow-xs transition-all"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Click Photo with Camera</span>
                          </button>

                          {/* Mobile Native Direct Snap Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInvoiceForPhoto(invoice);
                              mobileCameraInputRef.current?.click();
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563] text-xs font-semibold shadow-xs"
                            title="Open native device camera"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Browse / Snap</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Package Weight & Specifications */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#111827] font-mono">
                        <Scale className="h-4 w-4 text-[#005E82]" />
                        <span>Physical Package Specs</span>
                      </div>

                      {/* Quick weight presets for fast high-volume depot entry */}
                      {!isPacked && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPackageWeights({ ...packageWeights, [invoice.id]: 2.5 })}
                            className="px-2 py-0.5 rounded bg-white hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] text-[10px] font-mono shadow-xs"
                          >
                            2.5kg
                          </button>
                          <button
                            type="button"
                            onClick={() => setPackageWeights({ ...packageWeights, [invoice.id]: 5.0 })}
                            className="px-2 py-0.5 rounded bg-white hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] text-[10px] font-mono shadow-xs"
                          >
                            5kg
                          </button>
                          <button
                            type="button"
                            onClick={() => setPackageWeights({ ...packageWeights, [invoice.id]: 10.0 })}
                            className="px-2 py-0.5 rounded bg-white hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] text-[10px] font-mono shadow-xs"
                          >
                            10kg
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1 font-medium">
                          Total Box Weight (KG)
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          min={0.1}
                          disabled={isPacked}
                          value={packageWeights[invoice.id] ?? 4.5}
                          onChange={(e) =>
                            setPackageWeights({
                              ...packageWeights,
                              [invoice.id]: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] text-xs font-mono focus:border-[#005E82] focus:outline-none disabled:opacity-60 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1 font-medium">
                          Box / Parcel Count
                        </label>
                        <input
                          type="number"
                          min={1}
                          disabled={isPacked}
                          value={packageBoxes[invoice.id] ?? 1}
                          onChange={(e) =>
                            setPackageBoxes({
                              ...packageBoxes,
                              [invoice.id]: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] text-xs font-mono focus:border-[#005E82] focus:outline-none disabled:opacity-60 shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Optional package notes / Fragile sticker verified..."
                        disabled={isPacked}
                        value={packingNotes[invoice.id] ?? ''}
                        onChange={(e) =>
                          setPackingNotes({
                            ...packingNotes,
                            [invoice.id]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] text-xs focus:border-[#005E82] focus:outline-none placeholder-[#9CA3AF] disabled:opacity-60 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2">
                  {!isPacked ? (
                    <button
                      type="button"
                      onClick={() => handlePackOrder(invoice)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F15A29] hover:bg-[#D9471B] text-white text-sm font-bold shadow-xs transition-all active:scale-98"
                    >
                      <FileCheck className="h-5 w-5" />
                      <span>Mark Packed & Verified for Dispatch</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#15803D]/10 border border-[#15803D]/30 text-[#15803D] text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                      <span>Packed & Verified — Ready in Dispatch Queue</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING BATCH PACKING ACTION BAR                                     */}
      {/* ===================================================================== */}
      {selectedInvoiceIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 sm:left-auto max-w-xl z-40 bg-white/95 backdrop-blur-xl border border-[#E5E7EB] p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ring-1 ring-[#005E82]/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#F15A29] text-white flex items-center justify-center font-bold font-mono shadow-xs shrink-0">
              {selectedInvoiceIds.size}
            </div>
            <div>
              <div className="text-xs font-bold text-[#111827]">
                {selectedInvoiceIds.size} Orders Selected for Batch Packing
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Mark all selected orders packed & verified with default specs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSelectedInvoiceIds(new Set())}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
            >
              Deselect All
            </button>
            <button
              onClick={handleBatchPackSelected}
              disabled={isBatchPacking}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F15A29] hover:bg-[#D9471B] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {isBatchPacking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Batch Packing...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>Pack All ({selectedInvoiceIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* INTERACTIVE LIVE CAMERA VIEWFINDER MODAL                              */}
      {/* ===================================================================== */}
      {isCameraModalOpen && activeInvoiceForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#005E82]/10 text-[#005E82] border border-[#005E82]/20">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Capture Package Photo</h3>
                  <p className="text-[11px] text-[#6B7280] font-mono">
                    Invoice #{activeInvoiceForPhoto.invoiceNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isCameraActive && (
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] transition-colors"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Viewfinder / Snapshot Area */}
            <div className="relative bg-black h-72 sm:h-80 flex items-center justify-center overflow-hidden">
              {capturedImageData ? (
                // Snapshot Preview
                <img
                  src={capturedImageData}
                  alt="Captured Package"
                  className="h-full w-full object-contain"
                />
              ) : isCameraActive ? (
                // Live Stream Video
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {/* Camera Target Crosshairs Guide */}
                  <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] font-mono text-white bg-black/70 px-2 py-0.5 rounded-full">
                      Align Package & Label inside frame
                    </span>
                  </div>
                </>
              ) : cameraError ? (
                // Error Fallback
                <div className="p-6 text-center space-y-3 bg-white">
                  <AlertCircle className="h-10 w-10 text-[#B45309] mx-auto" />
                  <p className="text-xs text-[#4B5563] max-w-xs">{cameraError}</p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => mobileCameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-[#F15A29] hover:bg-[#D9471B] text-white text-xs font-bold shadow-xs"
                    >
                      Browse / Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(cameraFacingMode)}
                      className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-xs font-semibold"
                    >
                      Retry Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-white mx-auto" />
                  <p className="text-xs text-white/80 font-mono">Initializing Camera...</p>
                </div>
              )}
            </div>

            {/* Modal Controls Footer */}
            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between gap-3">
              {capturedImageData ? (
                <>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacingMode)}
                    disabled={isUploadingPhoto}
                    className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#E5E7EB] text-[#111827] text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Retake Snapshot
                  </button>

                  <button
                    type="button"
                    onClick={() => uploadCapturedPhoto(capturedImageData, activeInvoiceForPhoto)}
                    disabled={isUploadingPhoto}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Use This Photo</span>
                      </>
                    )}
                  </button>
                </>
              ) : isCameraActive ? (
                <div className="w-full flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="text-xs text-[#005E82] hover:underline font-mono font-semibold"
                  >
                    Use File Picker
                  </button>

                  {/* Big Shutter Button */}
                  <button
                    type="button"
                    onClick={capturePhotoSnapshot}
                    className="h-14 w-14 rounded-full border-4 border-[#E5E7EB] bg-[#005E82] hover:bg-[#004B68] shadow-md flex items-center justify-center mx-auto transition-transform active:scale-90"
                    title="Click Photo"
                  >
                    <div className="h-5 w-5 rounded-full bg-white" />
                  </button>

                  <div className="w-24 text-right">
                    <span className="text-[10px] text-[#005E82] font-mono font-bold">Live Stream</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="w-full py-2.5 rounded-xl bg-[#E5E7EB] text-[#111827] text-xs font-semibold hover:bg-[#D1D5DB]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Size Photo Zoom Preview Modal */}
      {previewingPhotoUrl && (
        <div
          onClick={() => setPreviewingPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white p-2">
            <button
              onClick={() => setPreviewingPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewingPhotoUrl}
              alt="Full Package Photo"
              className="w-full h-full object-contain max-h-[80vh] rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
