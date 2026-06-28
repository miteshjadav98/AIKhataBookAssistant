import { z } from 'zod';
import { TicketPriority } from '@prisma/client';

export const CreateTicketSchema = z.object({
  category: z.string().min(2, 'Category is required'),
  priority: z.nativeEnum(TicketPriority).default('MEDIUM'),
  issueSummary: z.string().min(3, 'Issue summary is required'),
  issueDetails: z.string().optional(),
});

export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;
