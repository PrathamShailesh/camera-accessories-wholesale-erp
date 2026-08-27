import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: products must be a non-empty array' },
        { status: 400 }
      );
    }

    const allDepots = await prisma.depot.findMany();
    const depotMap = new Map(allDepots.map((d) => [d.id, d]));
    const depotCodeMap = new Map(allDepots.map((d) => [d.code.toLowerCase(), d]));

    // Fetch existing SKUs and Barcodes to prevent duplicate collisions
    const existingProducts = await prisma.product.findMany({
      select: { sku: true, barcode: true },
    });
    const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));
    const existingBarcodes = new Set(existingProducts.map((p) => p.barcode));

    const processedSkusInBatch = new Set<string>();
    const validProductsToInsert: any[] = [];
    const failedRows: { row: number; sku?: string; name?: string; error: string }[] = [];

    // 1. Validation loop
    for (let index = 0; index < products.length; index++) {
      const p = products[index];
      const rowNum = index + 1;

      const name = p.name?.toString().trim();
      const rawSku = p.sku?.toString().trim();
      const brand = p.brand?.toString().trim();
      const categoryName = p.category?.toString().trim() || p.categoryName?.toString().trim() || 'General Optics';

      if (!name) {
        failedRows.push({ row: rowNum, sku: rawSku, name: name || 'Untitled', error: 'Product name is missing' });
        continue;
      }
      if (!rawSku) {
        failedRows.push({ row: rowNum, name, error: 'Product SKU is missing' });
        continue;
      }
      if (!brand) {
        failedRows.push({ row: rowNum, sku: rawSku, name, error: 'Brand is missing' });
        continue;
      }

      const cleanSku = rawSku.toUpperCase();

      if (existingSkus.has(cleanSku)) {
        failedRows.push({ row: rowNum, sku: cleanSku, name, error: `SKU "${cleanSku}" already exists in database` });
        continue;
      }

      if (processedSkusInBatch.has(cleanSku)) {
        failedRows.push({ row: rowNum, sku: cleanSku, name, error: `Duplicate SKU "${cleanSku}" found within the same import file` });
        continue;
      }

      const purchasePrice = parseFloat(p.purchasePrice) || 0;
      const wholesalePrice = parseFloat(p.wholesalePrice) || 0;
      const sellingPrice = parseFloat(p.sellingPrice) || 0;

      if (purchasePrice < 0 || wholesalePrice < 0 || sellingPrice < 0) {
        failedRows.push({ row: rowNum, sku: cleanSku, name, error: 'Pricing fields cannot be negative numbers' });
        continue;
      }

      processedSkusInBatch.add(cleanSku);

      let barcode = p.barcode?.toString().trim();
      if (!barcode || existingBarcodes.has(barcode)) {
        barcode = `8809${Math.floor(10000000 + Math.random() * 90000000)}`;
      }
      existingBarcodes.add(barcode);

      // Parse depot stock values
      const depotBreakdown: Record<string, number> = {};
      
      // Check explicit depotBreakdown object or flattened depot columns
      allDepots.forEach((depot) => {
        const depotCodeLower = depot.code.toLowerCase().replace('dep-', '');
        const directKeyVal = p.depotBreakdown?.[depot.id] ?? 
                             p[`${depotCodeLower}Stock`] ?? 
                             p[depot.id] ?? 
                             p[depot.code] ?? 
                             p[depot.name] ?? 
                             0;
        depotBreakdown[depot.id] = Math.max(0, parseInt(directKeyVal) || 0);
      });

      const totalStock = Object.values(depotBreakdown).reduce((sum, q) => sum + q, 0);

      const trackSerial = p.trackSerial === true || 
                          p.trackSerial === 'true' || 
                          p.trackSerial === 'TRUE' || 
                          p.trackSerial === 1 || 
                          p.trackSerial === '1' || 
                          p.trackSerial === 'yes' || 
                          p.trackSerial === 'YES';

      validProductsToInsert.push({
        rowNum,
        cleanSku,
        name,
        brand,
        model: p.model?.toString().trim() || '',
        categoryName,
        description: p.description?.toString().trim() || '',
        imageUrl: p.imageUrl?.toString().trim() || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        barcode,
        purchasePrice,
        wholesalePrice,
        sellingPrice,
        taxRate: parseFloat(p.taxRate) || 5,
        minStockLevel: parseInt(p.minStockLevel) || 10,
        trackSerial,
        depotBreakdown,
        totalStock,
      });
    }

    // 2. Database Insertion Loop (with atomic category resolution & serial number generator)
    let successfullyImportedCount = 0;
    const categoriesCache = new Map<string, string>();

    // Fetch existing categories into cache
    const existingCategories = await prisma.category.findMany();
    existingCategories.forEach((c) => {
      categoriesCache.set(c.name.toLowerCase(), c.id);
    });

    for (const item of validProductsToInsert) {
      try {
        const catKey = item.categoryName.toLowerCase();
        let categoryId = categoriesCache.get(catKey);

        if (!categoryId) {
          const catSlug = item.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const newCat = await prisma.category.create({
            data: {
              name: item.categoryName,
              slug: `${catSlug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              description: `${item.categoryName} optics & hardware`,
            },
          });
          categoryId = newCat.id;
          categoriesCache.set(catKey, categoryId);
        }

        const productId = `prod-${item.cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        const createdProduct = await prisma.product.create({
          data: {
            id: productId,
            sku: item.cleanSku,
            name: item.name,
            brand: item.brand,
            model: item.model,
            categoryId,
            categoryName: item.categoryName,
            description: item.description,
            imageUrl: item.imageUrl,
            barcode: item.barcode,
            trackSerial: item.trackSerial,
            purchasePrice: item.purchasePrice,
            wholesalePrice: item.wholesalePrice,
            sellingPrice: item.sellingPrice,
            taxRate: item.taxRate,
            minStockLevel: item.minStockLevel,
            status: 'ACTIVE',
            totalStock: item.totalStock,
          },
        });

        // Insert depot inventories and serials
        const serialsToCreate: any[] = [];
        for (const [depotId, qty] of Object.entries(item.depotBreakdown)) {
          const quantity = qty as number;
          const depot = depotMap.get(depotId);
          if (depot) {
            await prisma.depotInventory.upsert({
              where: {
                productId_depotId: {
                  productId: createdProduct.id,
                  depotId: depot.id,
                },
              },
              create: {
                productId: createdProduct.id,
                depotId: depot.id,
                quantity,
                allocatedQuantity: 0,
                availableQuantity: quantity,
                minStockLevel: item.minStockLevel || 5,
              },
              update: {
                quantity,
                availableQuantity: quantity,
              },
            });

            if (item.trackSerial && quantity > 0) {
              const depotCode = depot.code.replace('DEP-', '');
              for (let i = 1; i <= Math.min(quantity, 50); i++) {
                const randomCode = Math.floor(1000 + Math.random() * 9000);
                serialsToCreate.push({
                  productId: createdProduct.id,
                  productSku: createdProduct.sku,
                  productName: createdProduct.name,
                  serialNumber: `SN-${item.cleanSku}-${depotCode}-${String(i).padStart(3, '0')}-${randomCode}`,
                  depotId: depot.id,
                  depotName: depot.name,
                  status: 'IN_STOCK',
                  historyJson: JSON.stringify([
                    {
                      action: 'BULK_IMPORT_INITIAL_STOCK',
                      depot: depot.name,
                      timestamp: new Date().toISOString(),
                      notes: 'Imported via Excel/CSV batch process',
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

        // Sync with memory store
        try {
          dataStore.createProduct({
            sku: createdProduct.sku,
            name: createdProduct.name,
            brand: createdProduct.brand,
            model: createdProduct.model || '',
            categoryId: createdProduct.categoryId,
            categoryName: createdProduct.categoryName || item.categoryName,
            description: createdProduct.description,
            imageUrl: createdProduct.imageUrl,
            barcode: createdProduct.barcode,
            trackSerial: createdProduct.trackSerial,
            purchasePrice: createdProduct.purchasePrice,
            sellingPrice: createdProduct.sellingPrice,
            wholesalePrice: createdProduct.wholesalePrice,
            taxRate: createdProduct.taxRate,
            minStockLevel: createdProduct.minStockLevel,
            status: 'ACTIVE',
            depotBreakdown: item.depotBreakdown,
          });
        } catch {}

        successfullyImportedCount++;
      } catch (insertError: any) {
        failedRows.push({
          row: item.rowNum,
          sku: item.cleanSku,
          name: item.name,
          error: insertError.message || 'Database insertion error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalSubmitted: products.length,
      importedCount: successfullyImportedCount,
      failedCount: failedRows.length,
      errors: failedRows,
    });
  } catch (error: any) {
    console.error('Bulk product import error:', error);
    return NextResponse.json({ error: error.message || 'Bulk import failed' }, { status: 500 });
  }
}
