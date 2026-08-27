import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      courier,
      customCourierName,
      airwayBillNumber,
      trackingUrl,
      shippingCost,
      weightKg,
      packageCount,
      dimensionsCm,
      airwayBillDocUrl,
      packagePhotoUrl,
    } = body;

    if (!airwayBillNumber) {
      return NextResponse.json({ error: 'Airway Bill number is required' }, { status: 400 });
    }

    const shipment = dataStore.dispatchShipment(params.id, {
      courier: courier || 'DHL_EXPRESS',
      customCourierName,
      airwayBillNumber,
      trackingUrl: trackingUrl || `https://track.courier.com/?awb=${airwayBillNumber}`,
      shippingCost: Number(shippingCost) || 0,
      weightKg: Number(weightKg) || 1,
      packageCount: Number(packageCount) || 1,
      dimensionsCm,
      airwayBillDocUrl,
      packagePhotoUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Order dispatched with Airway Bill ${airwayBillNumber}`,
      shipment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Dispatch failed' }, { status: 400 });
  }
}
