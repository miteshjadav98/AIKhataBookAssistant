import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

describe('SupportController', () => {
  let controller: SupportController;
  let service: {
    createTicket: jest.Mock;
    getTickets: jest.Mock;
    getTicketById: jest.Mock;
    updateTicket: jest.Mock;
  };

  const req = { user: { shopId: 'shop-1', sub: 'user-1' } };

  beforeEach(async () => {
    service = {
      createTicket: jest.fn(),
      getTickets: jest.fn(),
      getTicketById: jest.fn(),
      updateTicket: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [{ provide: SupportService, useValue: service }],
    }).compile();

    controller = module.get<SupportController>(SupportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createTicket forwards shopId/userId from req.user and validated body', async () => {
    service.createTicket.mockResolvedValue({ id: 't1' });

    const result = await controller.createTicket(req, {
      category: 'PAYMENT',
      issueSummary: 'Not reflected',
    } as any);

    expect(service.createTicket).toHaveBeenCalledWith(
      'shop-1',
      'user-1',
      // priority defaults to MEDIUM via the Zod schema
      expect.objectContaining({
        category: 'PAYMENT',
        issueSummary: 'Not reflected',
        priority: 'MEDIUM',
      }),
    );
    expect(result).toEqual({ status: 'success', message: 'Ticket created', data: { id: 't1' } });
  });

  it('createTicket rejects an invalid body (missing summary)', async () => {
    await expect(
      controller.createTicket(req, { category: 'PAYMENT' } as any),
    ).rejects.toThrow();
    expect(service.createTicket).not.toHaveBeenCalled();
  });

  it('getTicket delegates with the shop scope', async () => {
    service.getTicketById.mockResolvedValue({ id: 't1' });
    const result = await controller.getTicket(req, 't1');
    expect(service.getTicketById).toHaveBeenCalledWith('shop-1', 't1');
    expect(result).toEqual({ status: 'success', data: { id: 't1' } });
  });

  it('updateTicket validates and delegates', async () => {
    service.updateTicket.mockResolvedValue({ id: 't1', status: 'RESOLVED' });
    const result = await controller.updateTicket(req, 't1', { status: 'RESOLVED' } as any);
    expect(service.updateTicket).toHaveBeenCalledWith('shop-1', 't1', { status: 'RESOLVED' });
    expect(result).toEqual({ status: 'success', data: { id: 't1', status: 'RESOLVED' } });
  });

  it('updateTicket rejects an empty update body', async () => {
    await expect(controller.updateTicket(req, 't1', {} as any)).rejects.toThrow();
    expect(service.updateTicket).not.toHaveBeenCalled();
  });
});
