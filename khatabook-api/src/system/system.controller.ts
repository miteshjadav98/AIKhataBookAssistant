import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('system')
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats(@Headers('x-admin-secret') secret: string) {
    // Only allow if the secret matches the env variable (or a fallback)
    const expectedSecret = process.env.SYSTEM_ADMIN_SECRET || 'mjadminsecret';
    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalShops,
      totalUsers,
      totalCustomers,
      totalSales,
      activeUsers24h,
      activeCustomers24h,
    ] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.user.count(),
      this.prisma.customer.count(),
      this.prisma.salesTransaction.count(),
      this.prisma.user.count({ where: { lastLoginAt: { gte: oneDayAgo } } }),
      this.prisma.customer.count({ where: { lastLoginAt: { gte: oneDayAgo } } }),
    ]);

    return {
      success: true,
      data: {
        totalShops,
        totalShopkeepers: totalUsers,
        totalCustomers,
        totalSalesInvoices: totalSales,
        activeShopkeepers24h: activeUsers24h,
        activeCustomers24h,
        serverTime: now,
      },
    };
  }
}
