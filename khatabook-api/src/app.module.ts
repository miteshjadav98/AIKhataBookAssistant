import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { ProductModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { PurchaseModule } from './purchase/purchase.module';
import { SalesModule } from './sales/sales.module';
import { PaymentModule } from './payment/payment.module';
import { ReportsModule } from './reports/reports.module';
import { SystemController } from './system/system.controller';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = `redis://:${encodeURIComponent(process.env.REDIS_PASSWORD || '')}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
        console.log(`[CacheModule] Connecting to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

        const keyvRedis = new KeyvRedis(redisUrl);
        const keyv = new Keyv({ store: keyvRedis, namespace: 'cache' });

        keyv.on('error', (err: Error) => {
          console.error('[CacheModule] Redis Keyv connection error:', err.message);
        });

        return {
          stores: [keyv],
        };
      },
    }),
    PrismaModule,
    AuthModule,
    CustomerModule,
    ProductModule,
    SupplierModule,
    PurchaseModule,
    SalesModule,
    PaymentModule,
    ReportsModule,
  ],
  controllers: [AppController, SystemController],
  providers: [AppService],
})
export class AppModule {}
