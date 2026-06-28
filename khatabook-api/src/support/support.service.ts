import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  // shopId (= business_id) and userId come from the JWT, never the client.
  async createTicket(shopId: string, userId: string, data: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        shopId,
        userId,
        category: data.category,
        priority: data.priority,
        issueSummary: data.issueSummary,
        issueDetails: data.issueDetails,
      },
    });
  }

  async getTickets(shopId: string) {
    return this.prisma.supportTicket.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketById(shopId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, shopId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicket(shopId: string, id: string, data: UpdateTicketDto) {
    // Ensure the ticket exists and belongs to this shop before updating.
    await this.getTicketById(shopId, id);
    return this.prisma.supportTicket.update({
      where: { id },
      data,
    });
  }
}
