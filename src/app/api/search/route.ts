import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { depotIdFilter, guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'search.use');
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ success: true, results: [] });
    const depotId = depotIdFilter(auth.user);
    const contains = { contains: q, mode: 'insensitive' as const };

    try {
      const [invoices, products, customers, shipments, documents] = await Promise.all([
        prisma.taxInvoice.findMany({ where: { ...(depotId && { depotId }), OR: [{ invoiceNumber: contains }, { customerCompany: contains }] }, take: 5 }),
        prisma.product.findMany({ where: { OR: [{ sku: contains }, { name: contains }, { brand: contains }, { barcode: contains }], ...(depotId && { inventories: { some: { depotId } } }) }, take: 5 }),
        depotId ? [] : prisma.customer.findMany({ where: { OR: [{ companyName: contains }, { customerCode: contains }, { email: contains }] }, take: 5 }),
        prisma.shipment.findMany({ where: { ...(depotId && { depotId }), OR: [{ shipmentNumber: contains }, { airwayBillNumber: contains }, { customerCompany: contains }] }, take: 5 }),
        prisma.cloudDocument.findMany({ where: { ...(depotId && { depotId }), OR: [{ title: contains }, { fileName: contains }, { relatedEntityLabel: contains }] }, take: 5 }),
      ]);
      const results = [
        ...invoices.map((x) => ({ category: 'Tax Invoices', title: x.invoiceNumber, subtitle: `${x.customerCompany} • ${x.fulfilmentStatus}`, link: `/invoices/${x.id}`, badge: x.fulfilmentStatus })),
        ...products.map((x) => ({ category: 'Products & Inventory', title: `${x.name} (${x.sku})`, subtitle: `${x.brand} • Stock: ${x.totalStock}`, link: `/products/${x.id}`, badge: x.brand })),
        ...customers.map((x) => ({ category: 'Customers', title: x.companyName, subtitle: `${x.contactPerson} • ${x.country}`, link: `/customers/${x.id}`, badge: x.customerCode })),
        ...shipments.map((x) => ({ category: 'Shipments & Airway Bills', title: `AWB: ${x.airwayBillNumber}`, subtitle: `${x.customerCompany} • ${x.status}`, link: `/shipments/${x.id}`, badge: x.status })),
        ...documents.map((x) => ({ category: 'Cloud Documents', title: x.title, subtitle: x.fileName, link: `/documents?search=${encodeURIComponent(x.fileName)}`, badge: x.category })),
      ].slice(0, 15);
      return NextResponse.json({ success: true, results });
    } catch {
      const qLower = q.toLowerCase();
      const invoices = dataStore.getInvoices().filter((x) => x.invoiceNumber.toLowerCase().includes(qLower) || (x.customerCompany && x.customerCompany.toLowerCase().includes(qLower))).slice(0, 5);
      const products = dataStore.getProducts().filter((x) => x.sku.toLowerCase().includes(qLower) || x.name.toLowerCase().includes(qLower) || x.brand.toLowerCase().includes(qLower)).slice(0, 5);
      const customers = dataStore.getCustomers().filter((x) => x.companyName.toLowerCase().includes(qLower) || x.customerCode.toLowerCase().includes(qLower) || x.email.toLowerCase().includes(qLower)).slice(0, 5);
      const shipments = dataStore.getShipments().filter((x) => x.shipmentNumber.toLowerCase().includes(qLower) || x.airwayBillNumber.toLowerCase().includes(qLower) || (x.customerCompany && x.customerCompany.toLowerCase().includes(qLower))).slice(0, 5);
      const documents = dataStore.getDocuments().filter((x) => x.title.toLowerCase().includes(qLower) || x.fileName.toLowerCase().includes(qLower)).slice(0, 5);

      const results = [
        ...invoices.map((x) => ({ category: 'Tax Invoices', title: x.invoiceNumber, subtitle: `${x.customerCompany} • ${x.fulfilmentStatus}`, link: `/invoices/${x.id}`, badge: x.fulfilmentStatus })),
        ...products.map((x) => ({ category: 'Products & Inventory', title: `${x.name} (${x.sku})`, subtitle: `${x.brand} • Stock: ${x.totalStock}`, link: `/products/${x.id}`, badge: x.brand })),
        ...customers.map((x) => ({ category: 'Customers', title: x.companyName, subtitle: `${x.contactPerson} • ${x.country}`, link: `/customers/${x.id}`, badge: x.customerCode })),
        ...shipments.map((x) => ({ category: 'Shipments & Airway Bills', title: `AWB: ${x.airwayBillNumber}`, subtitle: `${x.customerCompany} • ${x.status}`, link: `/shipments/${x.id}`, badge: x.status })),
        ...documents.map((x) => ({ category: 'Cloud Documents', title: x.title, subtitle: x.fileName, link: `/documents?search=${encodeURIComponent(x.fileName)}`, badge: x.category })),
      ].slice(0, 15);

      return NextResponse.json({ success: true, results });
    }
  } catch (error: any) {
    return NextResponse.json({ success: true, results: [] });
  }
}
