export type DocumentKind = 'PROFORMA' | 'TAX_INVOICE' | 'PACKING_LIST' | 'SERVICE_INVOICE';

export interface SealPolicyResult {
  shouldSeal: boolean;
  reason: string;
  badgeLabel: string;
  isDraft: boolean;
  isCancelled: boolean;
  isPackingList: boolean;
}

/**
 * Determines whether the official registered corporate company seal
 * should be affixed to a document based on international trade and accounting standards.
 */
export function evaluateSealPolicy(params: {
  documentType: DocumentKind;
  status?: string;
  fulfilmentStatus?: string;
  paymentStatus?: string;
}): SealPolicyResult {
  const { documentType, status, fulfilmentStatus } = params;

  // 1. Packing Lists NEVER carry corporate legal seals (Warehouse dispatch sheets)
  if (documentType === 'PACKING_LIST') {
    return {
      shouldSeal: false,
      reason: 'Operational dispatch document — requires warehouse checker sign-off instead of legal corporate seal.',
      badgeLabel: 'Warehouse Sign-off',
      isDraft: false,
      isCancelled: false,
      isPackingList: true,
    };
  }

  // 2. Check for Cancelled / Void states
  const normalizedStatus = (status || fulfilmentStatus || '').toUpperCase();
  if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'VOID') {
    return {
      shouldSeal: false,
      reason: 'Cancelled document — legally void and unauthenticated.',
      badgeLabel: 'Void / Cancelled',
      isDraft: false,
      isCancelled: true,
      isPackingList: false,
    };
  }

  // 3. Check for Draft states
  if (normalizedStatus === 'DRAFT') {
    return {
      shouldSeal: false,
      reason: 'Preliminary draft document — unconfirmed agreements do not carry registered corporate seal.',
      badgeLabel: 'Draft / Unconfirmed',
      isDraft: true,
      isCancelled: false,
      isPackingList: false,
    };
  }

  // 4. Tax Invoices: Official legal tax documents carry the seal
  if (documentType === 'TAX_INVOICE') {
    return {
      shouldSeal: true,
      reason: 'Official commercial tax invoice — required for VAT & legal trade compliance.',
      badgeLabel: 'Official Tax Document',
      isDraft: false,
      isCancelled: false,
      isPackingList: false,
    };
  }

  // 5. Service Invoices: Carry the seal when finalized (SENT, PAID, OVERDUE)
  if (documentType === 'SERVICE_INVOICE') {
    const isFinalized =
      normalizedStatus === 'SENT' ||
      normalizedStatus === 'PAID' ||
      normalizedStatus === 'OVERDUE';
    return {
      shouldSeal: isFinalized,
      reason: isFinalized
        ? 'Finalized service invoice — authenticated for customer payment.'
        : 'Pending service invoice — awaiting finalization.',
      badgeLabel: isFinalized ? 'Officially Authenticated' : 'Pending Review',
      isDraft: !isFinalized,
      isCancelled: false,
      isPackingList: false,
    };
  }

  // 6. Proformas: Only confirmed or converted proformas carry the official seal for bank wire transfers & customs
  if (documentType === 'PROFORMA') {
    const isConfirmed =
      normalizedStatus === 'CONFIRMED' || normalizedStatus === 'CONVERTED';
    return {
      shouldSeal: isConfirmed,
      reason: isConfirmed
        ? 'Confirmed proforma invoice — authenticated for bank wire transfer and customs clearance.'
        : 'Quotation pending customer confirmation — unsealed.',
      badgeLabel: isConfirmed ? 'Confirmed Commercial Proforma' : 'Preliminary Quotation',
      isDraft: !isConfirmed,
      isCancelled: false,
      isPackingList: false,
    };
  }

  return {
    shouldSeal: false,
    reason: 'Standard document format.',
    badgeLabel: 'Standard Document',
    isDraft: false,
    isCancelled: false,
    isPackingList: false,
  };
}
