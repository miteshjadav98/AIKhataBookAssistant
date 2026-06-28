import {
  Controller, Post, Get, Patch, Body, Req, Param,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketSchema } from './dto/create-ticket.dto';
import { UpdateTicketSchema } from './dto/update-ticket.dto';
import type { CreateTicketDto } from './dto/create-ticket.dto';
import type { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket (business_id/user_id taken from JWT)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['category', 'issueSummary'],
      properties: {
        category: { type: 'string', example: 'PAYMENT' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
        issueSummary: { type: 'string', example: 'Payment not reflected' },
        issueDetails: { type: 'string', example: 'Customer paid via UPI but balance unchanged.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(@Req() req: any, @Body() body: CreateTicketDto) {
    const validationResult = CreateTicketSchema.safeParse(body);
    if (!validationResult.success) {
      throw new BadRequestException(validationResult.error.format());
    }

    const ticket = await this.supportService.createTicket(
      req.user.shopId,
      req.user.sub,
      validationResult.data,
    );

    return { status: 'success', message: 'Ticket created', data: ticket };
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List all support tickets for your shop' })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  async getTickets(@Req() req: any) {
    const tickets = await this.supportService.getTickets(req.user.shopId);
    return { status: 'success', data: tickets };
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get a single ticket (status check)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  async getTicket(@Req() req: any, @Param('id') id: string) {
    const ticket = await this.supportService.getTicketById(req.user.shopId, id);
    return { status: 'success', data: ticket };
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update a ticket (status / priority / details)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        category: { type: 'string' },
        issueSummary: { type: 'string' },
        issueDetails: { type: 'string' },
      },
    },
  })
  async updateTicket(@Req() req: any, @Param('id') id: string, @Body() body: UpdateTicketDto) {
    const validationResult = UpdateTicketSchema.safeParse(body);
    if (!validationResult.success) {
      throw new BadRequestException(validationResult.error.format());
    }

    const ticket = await this.supportService.updateTicket(req.user.shopId, id, validationResult.data);
    return { status: 'success', data: ticket };
  }
}
