import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: {
    supportTicket: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      supportTicket: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createTicket scopes shopId and userId from the caller (not the client)', async () => {
    prisma.supportTicket.create.mockResolvedValue({ id: 't1' });

    await service.createTicket('shop-1', 'user-1', {
      category: 'PAYMENT',
      priority: 'HIGH',
      issueSummary: 'Not reflected',
      issueDetails: 'paid via UPI',
    } as any);

    expect(prisma.supportTicket.create).toHaveBeenCalledWith({
      data: {
        shopId: 'shop-1',
        userId: 'user-1',
        category: 'PAYMENT',
        priority: 'HIGH',
        issueSummary: 'Not reflected',
        issueDetails: 'paid via UPI',
      },
    });
  });

  it('getTickets queries only this shop, newest first', async () => {
    prisma.supportTicket.findMany.mockResolvedValue([]);
    await service.getTickets('shop-1');
    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
      where: { shopId: 'shop-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('getTicketById returns the ticket when found', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue({ id: 't1', shopId: 'shop-1' });
    const result = await service.getTicketById('shop-1', 't1');
    expect(result).toEqual({ id: 't1', shopId: 'shop-1' });
    expect(prisma.supportTicket.findFirst).toHaveBeenCalledWith({
      where: { id: 't1', shopId: 'shop-1' },
    });
  });

  it('getTicketById throws NotFoundException when missing / wrong shop', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue(null);
    await expect(service.getTicketById('shop-1', 'nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updateTicket verifies ownership then updates', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue({ id: 't1', shopId: 'shop-1' });
    prisma.supportTicket.update.mockResolvedValue({ id: 't1', status: 'RESOLVED' });

    const result = await service.updateTicket('shop-1', 't1', { status: 'RESOLVED' } as any);

    expect(prisma.supportTicket.findFirst).toHaveBeenCalled();
    expect(prisma.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { status: 'RESOLVED' },
    });
    expect(result).toEqual({ id: 't1', status: 'RESOLVED' });
  });

  it('updateTicket refuses when the ticket is not in this shop', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue(null);
    await expect(
      service.updateTicket('shop-1', 't1', { status: 'RESOLVED' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.supportTicket.update).not.toHaveBeenCalled();
  });
});
