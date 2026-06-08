import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(shopId: string, startDateStr?: string, endDateStr?: string) {
    const whereClause: any = { shopId };
    
    if (startDateStr || endDateStr) {
      whereClause.createdAt = {};
      if (startDateStr) whereClause.createdAt.gte = new Date(startDateStr);
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const invoices = await this.prisma.salesTransaction.findMany({
      where: whereClause,
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });

    let totalSales = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const customerMap = new Map<string, any>();

    invoices.forEach(inv => {
      totalSales += inv.subtotal;
      totalPaid += inv.paidAmount;
      totalDue += inv.dueAmount;

      const custId = inv.customerId;
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: custId,
          customerName: inv.customer?.name || 'Unknown',
          customerPhone: inv.customer?.phone || '',
          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,
          invoiceCount: 0
        });
      }

      const c = customerMap.get(custId)!;
      c.totalPurchases += inv.subtotal;
      c.totalPaid += inv.paidAmount;
      c.totalDue += inv.dueAmount;
      c.invoiceCount += 1;
    });

    // Also get customers with overall outstanding dues independent of the date range
    const outstandingCustomers = await this.prisma.customer.findMany({
      where: { shopId, totalReceivable: { gt: 0 } },
      select: { id: true, name: true, phone: true, totalReceivable: true },
      orderBy: { totalReceivable: 'desc' }
    });

    return {
      salesSummary: {
        totalSales,
        totalPaid,
        totalDue,
        invoiceCount: invoices.length
      },
      customerSummary: Array.from(customerMap.values()),
      outstandingDues: outstandingCustomers,
      invoices
    };
  }
}
