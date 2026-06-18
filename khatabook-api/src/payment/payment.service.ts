import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createPayment(shopId: string, data: CreatePaymentDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the payment record
      const payment = await tx.payment.create({
        data: {
          shopId,
          type: data.type,
          customerId: data.customerId,
          supplierId: data.supplierId,
          amount: data.amount,
          paymentMode: data.paymentMode,
          notes: data.notes,
        },
      });

      // Update the respective party's due balance
      if (data.type === 'CUSTOMER_PAYMENT') {
        const customer = await tx.customer.findFirst({
          where: { id: data.customerId, shopId, isDeleted: false },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        // Customer pays us -> reduces their totalReceivable (due)
        await tx.customer.update({
          where: { id: data.customerId },
          data: { totalReceivable: { decrement: data.amount } },
        });
      } else if (data.type === 'SUPPLIER_PAYMENT') {
        const supplier = await tx.supplier.findFirst({
          where: { id: data.supplierId, shopId, isDeleted: false },
        });
        if (!supplier) throw new NotFoundException('Supplier not found');

        // We pay supplier -> reduces our totalPayable (due)
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { totalPayable: { decrement: data.amount } },
        });
      }

      return payment;
    });

    // Invalidate related caches
    await this.cacheManager.del(`payments_shop_${shopId}`);
    if (data.type === 'CUSTOMER_PAYMENT' && data.customerId) {
      await this.cacheManager.del(`customer_balance_${data.customerId}`);
      await this.cacheManager.del(`customers_shop_${shopId}`);
      await this.cacheManager.del(`customer_ledger_${data.customerId}`);
    }
    if (data.type === 'SUPPLIER_PAYMENT' && data.supplierId) {
      await this.cacheManager.del(`suppliers_shop_${shopId}`);
      await this.cacheManager.del(`supplier_${shopId}_${data.supplierId}`);
      await this.cacheManager.del(`supplier_ledger_${shopId}_${data.supplierId}`);
    }

    return result;
  }

  async getPayments(shopId: string) {
    console.log('[PaymentService.getPayments] Called for shopId:', shopId);

    const cacheKey = `payments_shop_${shopId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[PaymentService.getPayments] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[PaymentService.getPayments] CACHE MISS for:', cacheKey);

    const payments = await this.prisma.payment.findMany({
      where: { shopId },
      include: {
        customer: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.cacheManager.set(cacheKey, payments, 300000);
    return payments;
  }
}
