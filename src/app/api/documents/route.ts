import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { depotIdFilter, guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'documents.read');
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');

    const scopedDepotId = depotIdFilter(auth.user);
    const documents = await prisma.cloudDocument.findMany({
      where: {
        ...(entityId && { relatedEntityId: entityId }),
        ...(scopedDepotId && { depotId: scopedDepotId }),
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'documents.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    
    const depotId = depotIdFilter(auth.user);
    const document = await prisma.cloudDocument.create({
      data: { ...body, ...(depotId && { depotId }) },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await guardApi(req, 'documents.delete');
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    await prisma.cloudDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
