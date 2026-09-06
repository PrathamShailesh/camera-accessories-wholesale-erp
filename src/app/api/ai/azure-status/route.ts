import { NextRequest, NextResponse } from 'next/server';
import { getAzureConfig } from '@/lib/azure-document-intelligence';
import { guardApi } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'settings.read');
  if (!auth.ok) return auth.response;

  const config = getAzureConfig();

  return NextResponse.json({
    isConfigured: config.isConfigured,
    endpoint: config.endpoint ? `${config.endpoint.slice(0, 25)}...` : 'Not Configured (Demo Mode Active)',
    hasKey: Boolean(config.key),
    model: 'prebuilt-invoice',
    supportedFormats: ['application/pdf', 'scanned-ocr', 'image/jpeg', 'image/png'],
  });
}
