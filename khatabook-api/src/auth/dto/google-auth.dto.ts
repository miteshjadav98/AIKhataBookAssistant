import { z } from 'zod';

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
});

export type GoogleAuthDto = z.infer<typeof GoogleAuthSchema>;
