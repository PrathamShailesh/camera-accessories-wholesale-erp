import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function GET() {
  try {
    const stats = dataStore.getDashboardStats();
    const insights = dataStore.getBusinessInsights();
    const profitability = dataStore.getProfitabilityMetrics();

    return NextResponse.json({
      success: true,
      stats,
      insights,
      profitability,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
