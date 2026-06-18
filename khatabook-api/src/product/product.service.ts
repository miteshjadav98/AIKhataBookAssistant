import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Admin adds a product to their shop.
   */
  async createProduct(shopId: string, data: CreateProductDto) {
    console.log('[ProductService.createProduct] Called for shopId:', shopId, 'product:', data.name);

    try {
      const product = await this.prisma.product.create({
        data: {
          shopId,
          name: data.name,
          sku: data.sku,
          barcode: data.barcode,
          category: data.category,
          stockQty: data.stockQty ?? 0,
          defaultPurchasePrice: data.defaultPurchasePrice ?? 0,
          defaultSellingPrice: data.defaultSellingPrice ?? 0,
          lowStockThreshold: data.lowStockThreshold ?? 10,
          unit: data.unit ?? 'PIECES',
        },
      });

      console.log('[ProductService.createProduct] Product created:', product.id, product.name);

      // Invalidate product list cache
      await this.cacheManager.del(`products_shop_${shopId}`);

      return product;
    } catch (error) {
      console.error('[ProductService.createProduct] ERROR:', error.message || error);
      throw error;
    }
  }

  /**
   * Get all products for a shop (excluding soft-deleted).
   */
  async getProducts(shopId: string) {
    console.log('[ProductService.getProducts] Called for shopId:', shopId);

    const cacheKey = `products_shop_${shopId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[ProductService.getProducts] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[ProductService.getProducts] CACHE MISS for:', cacheKey);

    try {
      const products = await this.prisma.product.findMany({
        where: { shopId, isDeleted: false },
        orderBy: { name: 'asc' },
      });

      console.log('[ProductService.getProducts] Found', products.length, 'products');
      await this.cacheManager.set(cacheKey, products, 300000);
      return products;
    } catch (error) {
      console.error('[ProductService.getProducts] ERROR:', error.message || error);
      throw error;
    }
  }

  /**
   * Get a single product by ID with inventory movement history.
   */
  async getProductWithHistory(shopId: string, productId: string) {
    console.log('[ProductService.getProductWithHistory] Called for productId:', productId);

    const cacheKey = `product_${shopId}_${productId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[ProductService.getProductWithHistory] CACHE HIT for:', cacheKey);
      return cached;
    }
    console.log('[ProductService.getProductWithHistory] CACHE MISS for:', cacheKey);

    const product = await this.prisma.product.findFirst({
      where: { id: productId, shopId, isDeleted: false },
    });

    if (!product) {
      throw new NotFoundException('Product not found in your shop');
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where: { productId, shopId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate margin
    const margin = product.defaultSellingPrice - product.defaultPurchasePrice;
    const marginPercent = product.defaultPurchasePrice > 0 
      ? ((margin / product.defaultPurchasePrice) * 100).toFixed(1) 
      : '0';

    const result = {
      ...product,
      margin,
      marginPercent,
      movements,
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  /**
   * Update a product.
   */
  async updateProduct(shopId: string, productId: string, data: Partial<CreateProductDto>) {
    console.log('[ProductService.updateProduct] Called for productId:', productId);

    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, shopId, isDeleted: false },
      });

      if (!product) {
        console.log('[ProductService.updateProduct] Product not found:', productId);
        throw new NotFoundException('Product not found in your shop');
      }

      const updated = await this.prisma.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode,
          category: data.category,
          stockQty: data.stockQty,
          defaultPurchasePrice: data.defaultPurchasePrice,
          defaultSellingPrice: data.defaultSellingPrice,
          lowStockThreshold: data.lowStockThreshold,
          unit: data.unit,
        },
      });

      // Invalidate caches
      await this.cacheManager.del(`products_shop_${shopId}`);
      await this.cacheManager.del(`product_${shopId}_${productId}`);

      console.log('[ProductService.updateProduct] Product updated:', updated.id);
      return updated;
    } catch (error) {
      console.error('[ProductService.updateProduct] ERROR:', error.message || error);
      throw error;
    }
  }

  /**
   * Soft delete a product.
   */
  async deleteProduct(shopId: string, productId: string) {
    console.log('[ProductService.deleteProduct] Called for productId:', productId);

    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, shopId, isDeleted: false },
      });

      if (!product) {
        console.log('[ProductService.deleteProduct] Product not found:', productId);
        throw new NotFoundException('Product not found in your shop');
      }

      await this.prisma.product.update({
        where: { id: productId },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      // Invalidate caches
      await this.cacheManager.del(`products_shop_${shopId}`);
      await this.cacheManager.del(`product_${shopId}_${productId}`);

      console.log('[ProductService.deleteProduct] Product soft-deleted:', productId);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      console.error('[ProductService.deleteProduct] ERROR:', error.message || error);
      throw error;
    }
  }
}
