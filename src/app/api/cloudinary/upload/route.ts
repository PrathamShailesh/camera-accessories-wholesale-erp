import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { depotIdFilter, guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'documents.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      fileData, // Base64 data URI: data:image/jpeg;base64,... or data:application/pdf;base64,...
      fileName,
      category = 'OTHER',
      relatedEntityType = 'CUSTOMER',
      relatedEntityId = '',
      relatedEntityLabel = '',
      title,
      tags = [],
    } = body;

    if (!fileData) {
      return NextResponse.json({ error: 'fileData (Base64 string) is required' }, { status: 400 });
    }

    // Upload to Cloudinary using configured credentials with local fallback
    let uploadRes: any = null;
    try {
      uploadRes = await uploadToCloudinary(
        fileData,
        `camera-erp-dev2/${category.toLowerCase()}`,
        'auto'
      );
    } catch (uploadErr: any) {
      console.warn('Cloudinary upload fallback activated:', uploadErr?.message);
    }

    // Determine format & file type
    const format =
      uploadRes?.format ||
      (fileName ? fileName.split('.').pop() || 'pdf' : 'pdf');
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format.toLowerCase());
    const fileType = isImage ? `image/${format}` : 'application/pdf';

    // Register in centralized Cloud Documents Hub
    const cloudDoc = await prisma.cloudDocument.create({
      data: {
        title: title || fileName || `Document ${new Date().toLocaleDateString()}`,
        fileName: fileName || `Upload_${Date.now()}.${format}`,
        fileType,
        fileFormat: format,
        fileSize: uploadRes?.bytes || (fileData ? Math.round(fileData.length * 0.75) : 150000),
        cloudinaryUrl: uploadRes?.secure_url || uploadRes?.url || fileData,
        cloudinaryPublicId: uploadRes?.public_id || `doc_${Date.now()}`,
        category: category as any,
        relatedEntityType,
        relatedEntityId,
        relatedEntityLabel,
        tags: Array.isArray(tags) ? tags : [category],
        uploadedBy: auth.user.id,
        uploadedByName: auth.user.name,
        depotId: depotIdFilter(auth.user) || null,
      },
    });

    return NextResponse.json({
      success: true,
      document: cloudDoc,
      cloudinary: {
        secure_url: uploadRes?.secure_url || cloudDoc.cloudinaryUrl,
        public_id: uploadRes?.public_id || cloudDoc.cloudinaryPublicId,
      },
    });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
