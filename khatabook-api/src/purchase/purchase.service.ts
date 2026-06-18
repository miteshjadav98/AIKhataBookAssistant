import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createPurchase(shopId: string, data: CreatePurchaseDto) {
    console.log('[PurchaseService.createPurchase] shopId:', shopId, data);
    
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: data.supplierId, shopId, isDeleted: false },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const dueAmount = data.subtotal - data.discount - data.paidAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          shopId,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          items: data.items,
          subtotal: data.subtotal,
          discount: data.discount,
          paidAmount: data.paidAmount,
          dueAmount: dueAmount,
          paymentMode: data.paymentMode,
          notes: data.notes,
        },
      });

      // 2. Update Supplier Due
      if (dueAmount !== 0) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { totalPayable: { increment: dueAmount } },
        });
      }

      // 3. Process each item: update stock, prices, and create inventory movement
      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, shopId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const beforeQty = product.stockQty;
        const afterQty = beforeQty + item.qty;

        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQty: afterQty,
            defaultPurchasePrice: item.purchasePrice,
            ...(item.sellingPrice ? { defaultSellingPrice: item.sellingPrice } : {}),
          },
        });

        await tx.inventoryMovement.create({
          data: {
            shopId,
            productId: product.id,
            type: 'PURCHASE',
            qty: item.qty,
            beforeQty,
            afterQty,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
          },
        });
      }

      return purchase;
    });

    // Invalidate related caches
    await this.cacheManager.del(`purchases_shop_${shopId}`);
    await this.cacheManager.del(`products_shop_${shopId}`);
    await this.cacheManager.del(`suppliers_shop_${shopId}`);
    await this.cacheManager.del(`supplier_${shopId}_${data.supplierId}`);
    await this.cacheManager.del(`supplier_ledger_${shopId}_${data.supplierId}`);

    return result;
  }

  async getPurchases(shopId: string) {
    console.log('[PurchaseService.getPurchases] Called for shopId:', shopId);

    const cacheKey = `purchases_shop_${shopId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[PurchaseService.getPurchases] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[PurchaseService.getPurchases] CACHE MISS for:', cacheKey);

    const purchases = await this.prisma.purchase.findMany({
      where: { shopId },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });

    await this.cacheManager.set(cacheKey, purchases, 300000);
    return purchases;
  }

  async getPurchaseById(shopId: string, purchaseId: string) {
    console.log('[PurchaseService.getPurchaseById] Called for purchaseId:', purchaseId);

    const cacheKey = `purchase_${shopId}_${purchaseId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[PurchaseService.getPurchaseById] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[PurchaseService.getPurchaseById] CACHE MISS for:', cacheKey);

    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, shopId },
      include: { supplier: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    const itemsWithNames = await Promise.all(
      (purchase.items as any[]).map(async (item: any) => {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId },
          select: { name: true, unit: true },
        });
        return { ...item, productName: product?.name || 'Deleted Product', unit: product?.unit || 'PIECES' };
      })
    );

    const result = { ...purchase, items: itemsWithNames };
    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }
}
