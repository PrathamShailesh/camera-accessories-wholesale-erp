import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';

export async function GET() {
  try {
    const [products, depots] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          inventories: {
            include: { depot: true },
          },
          serialNumbers: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.depot.findMany({ select: { id: true, code: true, name: true } }),
    ]);

    const formatted = products.map((product) => {
      const depotBreakdown: Record<string, number> = {};
      // Initialize all depots with 0 so the frontend always has consistent depot stock keys
      depots.forEach((d) => {
        depotBreakdown[d.id] = 0;
      });

      let totalStock = 0;
      for (const inv of product.inventories) {
        depotBreakdown[inv.depotId] = inv.quantity;
        totalStock += inv.quantity;
      }

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        model: product.model || '',
        categoryId: product.categoryId,
        categoryName: product.category?.name || product.categoryName || 'General Optics',
        subcategory: product.subcategory || '',
        description: product.description || '',
        imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        barcode: product.barcode,
        trackSerial: product.trackSerial,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        wholesalePrice: product.wholesalePrice,
        taxRate: product.taxRate,
        minStockLevel: product.minStockLevel,
        status: product.status as 'ACTIVE' | 'ARCHIVED',
        totalStock,
        depotBreakdown,
        serialCount: product.serialNumbers?.length || 0,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      sku,
      brand,
      model,
      categoryName,
      description,
      barcode,
      imageUrl,
      purchasePrice,
      wholesalePrice,
      sellingPrice,
      taxRate = 5,
      trackSerial = true,
      minStockLevel = 10,
      depotBreakdown = {},
      status = 'ACTIVE',
    } = body;

    // Validation
    if (!name?.trim()) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    if (!sku?.trim()) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    if (!brand?.trim()) return NextResponse.json({ error: 'Brand is required' }, { status: 400 });

    const cleanSku = sku.trim().toUpperCase();

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({ where: { sku: cleanSku } });
    if (existingSku) {
      return NextResponse.json({ error: `Product with SKU "${cleanSku}" already exists` }, { status: 409 });
    }

    // Resolve or create category
    const catName = categoryName?.trim() || 'Camera Bodies';
    const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let category = await prisma.category.findFirst({
      where: {
        OR: [{ name: { equals: catName, mode: 'insensitive' } }, { slug: catSlug }],
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: catName,
          slug: `${catSlug}-${Date.now()}`,
          description: `${catName} equipment and optics`,
        },
      });
    }

    // Resolve barcode
    const cleanBarcode = barcode?.trim() || `8809${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Calculate total stock from depot breakdown
    const totalStock = Object.values(depotBreakdown).reduce(
      (sum: number, qty: any) => sum + (parseInt(qty) || 0),
      0
    );

    // Get all depots to map depot names and codes
    const allDepots = await prisma.depot.findMany();
    const depotMap = new Map(allDepots.map((d) => [d.id, d]));

    // Generate clean product ID
    const productId = `prod-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Create Product in Database
    const product = await prisma.product.create({
      data: {
        id: productId,
        sku: cleanSku,
        name: name.trim(),
        brand: brand.trim(),
        model: model?.trim() || '',
        categoryId: category.id,
        categoryName: category.name,
        description: description?.trim() || '',
        imageUrl: imageUrl?.trim() || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        barcode: cleanBarcode,
        trackSerial: Boolean(trackSerial),
        purchasePrice: Number(purchasePrice) || 0,
        wholesalePrice: Number(wholesalePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        taxRate: Number(taxRate) || 0,
        minStockLevel: Number(minStockLevel) || 10,
        status: status || 'ACTIVE',
        totalStock,
      },
    });

    // Create Depot Inventory & Serial Numbers
    const serialsToCreate: any[] = [];
    for (const [depotId, qtyRaw] of Object.entries(depotBreakdown)) {
      const qty = parseInt(qtyRaw as any) || 0;
      const depot = depotMap.get(depotId);
      if (depot) {
        await prisma.depotInventory.upsert({
          where: {
            productId_depotId: {
              productId: product.id,
              depotId: depot.id,
            },
          },
          create: {
            productId: product.id,
            depotId: depot.id,
            quantity: qty,
            allocatedQuantity: 0,
            availableQuantity: qty,
            minStockLevel: Number(minStockLevel) || 5,
          },
          update: {
            quantity: qty,
            availableQuantity: qty,
          },
        });

        // Generate serial numbers if trackSerial and qty > 0
        if (trackSerial && qty > 0) {
          const depotCode = depot.code.replace('DEP-', '');
          for (let i = 1; i <= Math.min(qty, 100); i++) {
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            serialsToCreate.push({
              productId: product.id,
              productSku: product.sku,
              productName: product.name,
              serialNumber: `SN-${cleanSku}-${depotCode}-${String(i).padStart(3, '0')}-${randomCode}`,
              depotId: depot.id,
              depotName: depot.name,
              status: 'IN_STOCK',
              historyJson: JSON.stringify([
                {
                  action: 'INITIAL_STOCK_ENTRY',
                  depot: depot.name,
                  timestamp: new Date().toISOString(),
                  notes: 'Initial inventory on-boarding',
                },
              ]),
            });
          }
        }
      }
    }

    if (serialsToCreate.length > 0) {
      await prisma.serialNumber.createMany({
        data: serialsToCreate,
        skipDuplicates: true,
      });
    }

    // Sync with in-memory dataStore
    try {
      dataStore.createProduct({
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        model: product.model || '',
        categoryId: product.categoryId,
        categoryName: product.categoryName || category.name,
        description: product.description,
        imageUrl: product.imageUrl,
        barcode: product.barcode,
        trackSerial: product.trackSerial,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        wholesalePrice: product.wholesalePrice,
        taxRate: product.taxRate,
        minStockLevel: product.minStockLevel,
        status: 'ACTIVE',
        depotBreakdown,
      });
    } catch {}

    return NextResponse.json(
      {
        success: true,
        product: {
          ...product,
          depotBreakdown,
          totalStock,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
