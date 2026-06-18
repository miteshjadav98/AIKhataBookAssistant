import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createSupplier(shopId: string, data: CreateSupplierDto) {
    if (data.phone) {
      const existingPhone = await this.prisma.supplier.findFirst({
        where: { shopId, phone: data.phone, isDeleted: false },
      });
      if (existingPhone) {
        throw new ConflictException('A supplier with this phone number already exists in your shop');
      }
    }

    if (data.email) {
      const existingEmail = await this.prisma.supplier.findFirst({
        where: { shopId, email: data.email, isDeleted: false },
      });
      if (existingEmail) {
        throw new ConflictException('A supplier with this email already exists in your shop');
      }
    }

    const result = await this.prisma.supplier.create({
      data: {
        shopId,
        ...data,
        phone: data.phone || null,
        email: data.email || null,
      },
    });

    // Invalidate supplier list cache
    await this.cacheManager.del(`suppliers_shop_${shopId}`);

    return result;
  }

  async getSuppliers(shopId: string) {
    console.log('[SupplierService.getSuppliers] Called for shopId:', shopId);

    const cacheKey = `suppliers_shop_${shopId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[SupplierService.getSuppliers] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[SupplierService.getSuppliers] CACHE MISS for:', cacheKey);

    const suppliers = await this.prisma.supplier.findMany({
      where: { shopId, isDeleted: false },
      orderBy: { name: 'asc' },
    });

    await this.cacheManager.set(cacheKey, suppliers, 300000);
    return suppliers;
  }

  async getSupplierById(shopId: string, supplierId: string) {
    console.log('[SupplierService.getSupplierById] Called for supplierId:', supplierId);

    const cacheKey = `supplier_${shopId}_${supplierId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[SupplierService.getSupplierById] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[SupplierService.getSupplierById] CACHE MISS for:', cacheKey);

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, shopId, isDeleted: false },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    await this.cacheManager.set(cacheKey, supplier, 300000);
    return supplier;
  }

  async getSupplierLedger(shopId: string, supplierId: string) {
    console.log('[SupplierService.getSupplierLedger] Called for supplierId:', supplierId);

    const cacheKey = `supplier_ledger_${shopId}_${supplierId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[SupplierService.getSupplierLedger] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[SupplierService.getSupplierLedger] CACHE MISS for:', cacheKey);

    // Get all purchases and payments for a specific supplier
    const purchases = await this.prisma.purchase.findMany({
      where: { shopId, supplierId },
      orderBy: { createdAt: 'desc' },
    });
    
    const payments = await this.prisma.payment.findMany({
      where: { shopId, supplierId, type: 'SUPPLIER_PAYMENT' },
      orderBy: { createdAt: 'desc' },
    });

    const result = { purchases, payments };
    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }
}
