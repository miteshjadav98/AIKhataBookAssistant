import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';

export const UpdateTicketSchema = z
  .object({
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    category: z.string().min(2).optional(),
    issueSummary: z.string().min(3).optional(),
    issueDetails: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;
